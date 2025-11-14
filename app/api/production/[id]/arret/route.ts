// app/api/production/[id]/arret/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const arretSchema = z.object({
  type: z.enum(['INCIDENT_TECHNIQUE', 'PANNE', 'MAINTENANCE', 'AUTRE']),
  heureDebut: z.string().datetime(),
  heureFin: z.string().datetime(),
  remarque: z.string().optional()
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (!session.user.access?.includes('CREATE_PRODUCTION_INVENTORY')) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    const inventoryId = parseInt(params.id);
    
    if (isNaN(inventoryId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = arretSchema.parse(body);

    // Vérifier que l'inventaire existe et est EN_COURS
    const inventory = await prisma.productionInventory.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    if (inventory.status !== 'EN_COURS') {
      return NextResponse.json(
        { error: 'Impossible d\'ajouter un arrêt à une journée terminée' },
        { status: 400 }
      );
    }

    // Calculer la durée en minutes
    const debut = new Date(validatedData.heureDebut);
    const fin = new Date(validatedData.heureFin);
    const duree = Math.floor((fin.getTime() - debut.getTime()) / 60000);

    if (duree <= 0) {
      return NextResponse.json(
        { error: 'L\'heure de fin doit être après l\'heure de début' },
        { status: 400 }
      );
    }

    // Vérifier que les heures sont dans la journée
    const inventoryDate = new Date(inventory.date);
    if (debut.toDateString() !== inventoryDate.toDateString() ||
        fin.toDateString() !== inventoryDate.toDateString()) {
      return NextResponse.json(
        { error: 'Les heures d\'arrêt doivent être dans la journée de production' },
        { status: 400 }
      );
    }

    // Transaction pour créer l'arrêt et mettre à jour l'inventaire
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'arrêt
      const arret = await tx.productionArret.create({
        data: {
          inventoryId,
          type: validatedData.type,
          heureDebut: debut,
          heureFin: fin,
          duree,
          remarque: validatedData.remarque,
          createdById: parseInt(session.user.id)
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Recalculer le temps total d'arrêt
      const allArrets = await tx.productionArret.findMany({
        where: { inventoryId }
      });

      const totalArret = allArrets.reduce((sum, a) => sum + a.duree, 0);

      // Calculer le temps écoulé depuis le début
      const now = new Date();
      const tempsTotal = Math.floor(
        (now.getTime() - inventory.startedAt.getTime()) / 60000
      );

      const tempsUtile = Math.max(0, tempsTotal - totalArret);
      const rendement = tempsTotal > 0 ? (tempsUtile / tempsTotal) * 100 : 0;

      // Mettre à jour l'inventaire
      const updatedInventory = await tx.productionInventory.update({
        where: { id: inventoryId },
        data: {
          tempsArret: totalArret,
          tempsTotal,
          tempsUtile,
          rendement
        }
      });

      return {
        arret,
        inventory: updatedInventory,
        totalArrets: allArrets.length
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erreur ajout arrêt:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET - Liste des arrêts pour un inventaire
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const inventoryId = parseInt(params.id);
    
    if (isNaN(inventoryId)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const arrets = await prisma.productionArret.findMany({
      where: { inventoryId },
      orderBy: { heureDebut: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const totalDuree = arrets.reduce((sum, arret) => sum + arret.duree, 0);

    return NextResponse.json({
      arrets,
      totalDuree,
      count: arrets.length
    });
  } catch (error) {
    console.error('Erreur récupération arrêts:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}