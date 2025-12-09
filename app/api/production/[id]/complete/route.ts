import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { calculateSphereData, validateSphereInput, SphereInputData } from '@/lib/utils/sphereCalculations';
import { z } from 'zod';

// Poids unitaires des bouteilles
const BOTTLE_WEIGHTS = {
  B2_7: 2.7,
  B6: 6,
  B9: 9,
  B12_5: 12.5,
  B12_5K: 12.5,
  B38: 38
};

type BottleType = 'B2_7' | 'B6' | 'B9' | 'B12_5' | 'B12_5K' | 'B38';

interface Bottle {
  type: BottleType;
  quantity: number;
}

// Schéma de validation pour les sphères
const sphereInputSchema = z.object({
  name: z.string().min(1), // Accept any reservoir name (D100, SO2, SO3, RO1, RO2, etc.)
  hauteur: z.number().min(0).max(30000),
  temperature: z.number().min(15.0).max(32.9),
  temperatureVapeur: z.number().min(15.0).max(32.9),
  volumeLiquide: z.number().min(0),
  pressionInterne: z.number().min(0).max(20),
  densiteA15C: z.number().min(0.4).max(0.6)
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id);
    const data = await req.json();

    // Transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier inventaire
      const inventory = await tx.productionInventory.findUnique({
        where: { id: inventoryId }
      });

      if (!inventory) {
        throw new Error('Inventaire non trouvé');
      }

      if (inventory.status === 'TERMINE') {
        throw new Error('Inventaire déjà terminé');
      }

      // Use manual time fields if provided, otherwise calculate from timestamps
      const now = new Date();
      const tempsTotal = data.tempsTotal || Math.floor(
        (now.getTime() - inventory.startedAt.getTime()) / 60000
      );

      // Créer les bouteilles
      let totalBottles = 0;
      let cumulSortie = data.ngabou + data.exports + data.divers;

      for (const bottle of data.bottles as Bottle[]) {
        const tonnage = (bottle.quantity * BOTTLE_WEIGHTS[bottle.type]) / 1000;
        
        await tx.bottleProduction.create({
          data: {
            inventoryId,
            type: bottle.type,
            quantity: bottle.quantity,
            tonnage
          }
        });

        totalBottles += bottle.quantity;
        cumulSortie += tonnage;
      }

      // Créer les réservoirs avec validation et calculs automatiques
      let stockFinalPhysique = 0;
      for (const reservoirInput of data.reservoirs) {
        // Valider le schéma Zod
        const parsedSphere = sphereInputSchema.parse(reservoirInput);

        // Valider les règles métier
        const validationErrors = validateSphereInput(parsedSphere as SphereInputData);
        if (validationErrors.length > 0) {
          throw new Error(`Erreur validation sphère ${parsedSphere.name}: ${validationErrors.join(', ')}`);
        }

        // Calculer toutes les valeurs dérivées
        const calculatedSphere = calculateSphereData(parsedSphere as SphereInputData);

        // Créer dans la DB avec toutes les valeurs (5 inputs + 6 calculées)
        await tx.reservoir.create({
          data: {
            inventoryId,
            name: calculatedSphere.name,
            reservoirConfigId: reservoirInput.reservoirConfigId,
            // 5 champs d'entrée
            hauteur: calculatedSphere.hauteur,
            temperature: calculatedSphere.temperature,
            temperatureVapeur: calculatedSphere.temperatureVapeur,
            volumeLiquide: calculatedSphere.volumeLiquide,
            pressionInterne: calculatedSphere.pressionInterne,
            densiteA15C: calculatedSphere.densiteA15C,
            // 6 champs calculés
            facteurCorrectionLiquide: calculatedSphere.facteurCorrectionLiquide,
            facteurCorrectionVapeur: calculatedSphere.facteurCorrectionVapeur,
            densiteAmbiante: calculatedSphere.densiteAmbiante,
            poidsLiquide: calculatedSphere.poidsLiquide,
            poidsGaz: calculatedSphere.poidsGaz,
            poidsTotal: calculatedSphere.poidsTotal
          }
        });

        // Utiliser le poids total calculé pour le stock final
        stockFinalPhysique += calculatedSphere.poidsLiquide;
      }

      // Calculs finaux
      const stockFinalTheorique =
        inventory.stockInitialPhysique +
        (data.butanier || 0) +
        data.recuperation +
        data.approSAR -
        cumulSortie;

      const ecart = stockFinalPhysique - stockFinalTheorique;
      const ecartPourcentage = stockFinalTheorique !== 0 
        ? (ecart / stockFinalTheorique) * 100 
        : 0;

      const rendement = tempsTotal > 0
        ? ((tempsTotal - inventory.tempsArret) / tempsTotal) * 100
        : 0;

      // Mettre à jour l'inventaire
      const updated = await tx.productionInventory.update({
        where: { id: inventoryId },
        data: {
          status: 'TERMINE',
          completedAt: now,
          completedById: parseInt(session.user.id),
          butanier: data.butanier,
          recuperation: data.recuperation,
          approSAR: data.approSAR,
          ngabou: data.ngabou,
          exports: data.exports,
          divers: data.divers,
          cumulSortie,
          stockFinalTheorique,
          stockFinalPhysique,
          ecart,
          ecartPourcentage,
          rendement,
          totalBottlesProduced: totalBottles,
          heureDebut: data.heureDebut,
          heureFin: data.heureFin,
          tempsTotal,
          tempsUtile: tempsTotal - inventory.tempsArret,
          observations: data.observations
        },
        include: {
          bottles: true,
          reservoirs: true,
          arrets: true
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur clôture inventaire:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}