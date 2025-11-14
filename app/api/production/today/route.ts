// app/api/production/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Date du jour à minuit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inventory = await prisma.productionInventory.findUnique({
      where: { date: today },
      include: {
        startedBy: {
          select: { id: true, name: true, email: true }
        },
        completedBy: {
          select: { id: true, name: true, email: true }
        },
        arrets: {
          orderBy: { heureDebut: 'asc' },
          include: {
            createdBy: { select: { id: true, name: true } }
          }
        },
        bottles: { orderBy: { type: 'asc' } },
        spheres: { orderBy: { name: 'asc' } }
      }
    });

    if (!inventory) {
      return NextResponse.json({ 
        exists: false,
        message: 'Aucun inventaire pour aujourd\'hui' 
      });
    }

    // Calcul du rendement en temps réel
    const totalDureeArrets = inventory.arrets.reduce(
      (sum, arret) => sum + arret.duree,
      0
    );
    
    const tempsEcoule = inventory.completedAt 
      ? Math.floor((new Date(inventory.completedAt).getTime() - new Date(inventory.startedAt).getTime()) / 60000)
      : Math.floor((Date.now() - new Date(inventory.startedAt).getTime()) / 60000);
    
    const tempsProductif = tempsEcoule - totalDureeArrets;
    const rendement = tempsProductif > 0 ? (tempsProductif / tempsEcoule) * 100 : 0;

    const formattedInventory = {
      ...inventory,
      exists: true,
      date: inventory.date.toISOString(),
      startedAt: inventory.startedAt.toISOString(),
      completedAt: inventory.completedAt?.toISOString(),
      tempsEcoule,
      totalDureeArrets,
      tempsProductif,
      rendement: parseFloat(rendement.toFixed(2)),
      arrets: inventory.arrets.map(arret => ({
        ...arret,
        heureDebut: arret.heureDebut.toISOString(),
        heureFin: arret.heureFin.toISOString(),
        createdAt: arret.createdAt.toISOString()
      }))
    };

    return NextResponse.json(formattedInventory);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}