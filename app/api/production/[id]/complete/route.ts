import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { calculateSphereData, validateSphereInput, SphereInputData, calculatePercentageBased } from '@/lib/utils/sphereCalculations';
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
  temperature: z.number().min(15.0).max(36.0),
  temperatureVapeur: z.number().min(15.0).max(36.0),
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
      let tempsTotal = data.tempsTotal || Math.floor(
        (now.getTime() - inventory.startedAt.getTime()) / 60000
      );

      // Subtract 60 minutes (1 hour) for lunch break
      tempsTotal = Math.max(0, tempsTotal - 60);

      // Calculate total appro and sorties from dynamic values
      const totalAppro = data.approValues
        ? Object.values(data.approValues).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
        : (data.butanier || 0) + (data.recuperation || 0) + (data.approSAR || 0);

      const totalSorties = data.sortieValues
        ? Object.values(data.sortieValues).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
        : (data.ngabou || 0) + (data.exports || 0) + (data.divers || 0);

      // Delete any existing bottles/reservoirs from autosave before recreating
      await tx.bottleProduction.deleteMany({ where: { inventoryId } });
      await tx.reservoir.deleteMany({ where: { inventoryId } });

      // Créer les bouteilles
      let totalBottles = 0;
      let cumulSortie = totalSorties;

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
        // Fetch reservoir configuration to check calculation mode
        const reservoirConfig = await tx.reservoirConfig.findUnique({
          where: { id: reservoirInput.reservoirConfigId }
        });

        if (!reservoirConfig) {
          throw new Error(`Configuration réservoir non trouvée pour ${reservoirInput.name}`);
        }

        let reservoirData;

        if (reservoirConfig.calculationMode === 'MANUAL') {
          // MANUAL MODE: Use poidsLiquide directly, no validation or calculations
          reservoirData = {
            inventoryId,
            name: reservoirInput.name,
            reservoirConfigId: reservoirInput.reservoirConfigId,
            // Store input values as-is (will be 0 or defaults)
            hauteur: reservoirInput.hauteur || 0,
            temperature: reservoirInput.temperature || 20,
            temperatureVapeur: reservoirInput.temperatureVapeur || 20,
            volumeLiquide: reservoirInput.volumeLiquide || 0,
            pressionInterne: reservoirInput.pressionInterne || 0,
            densiteA15C: reservoirInput.densiteA15C || 0.5,
            tankPercentage: 0,
            // Use provided weight directly
            poidsLiquide: reservoirInput.poidsLiquide || 0,
            poidsGaz: 0,
            poidsTotal: reservoirInput.poidsLiquide || 0,
            facteurCorrectionLiquide: 1,
            facteurCorrectionVapeur: 1,
            densiteAmbiante: 0.5
          };

          stockFinalPhysique += reservoirInput.poidsLiquide || 0;
        } else if (reservoirConfig.calculationMode === 'PERCENTAGE_BASED') {
          // PERCENTAGE_BASED MODE: Calculate from tank percentage, capacity, and shared densité ambiante
          const tankPercentage = reservoirInput.tankPercentage || 0;
          const sharedDensiteAmbiante = data.densiteAmbiante || 0;
          const capacityM3 = reservoirConfig.capacity;

          const poidsLiquide = calculatePercentageBased(tankPercentage, capacityM3, sharedDensiteAmbiante);

          reservoirData = {
            inventoryId,
            name: reservoirInput.name,
            reservoirConfigId: reservoirInput.reservoirConfigId,
            hauteur: 0,
            temperature: 20,
            temperatureVapeur: 20,
            volumeLiquide: 0,
            pressionInterne: 0,
            densiteA15C: 0,
            tankPercentage,
            poidsLiquide,
            poidsGaz: 0,
            poidsTotal: poidsLiquide,
            facteurCorrectionLiquide: 0,
            facteurCorrectionVapeur: 0,
            densiteAmbiante: sharedDensiteAmbiante
          };

          stockFinalPhysique += poidsLiquide;
        } else {
          // AUTOMATIC MODE: Validate and calculate
          // Valider le schéma Zod
          const parsedSphere = sphereInputSchema.parse(reservoirInput);

          // Valider les règles métier
          const validationErrors = validateSphereInput(parsedSphere as SphereInputData);
          if (validationErrors.length > 0) {
            throw new Error(`Erreur validation sphère ${parsedSphere.name}: ${validationErrors.join(', ')}`);
          }

          // Calculer toutes les valeurs dérivées
          const calculatedSphere = calculateSphereData(parsedSphere as SphereInputData);

          reservoirData = {
            inventoryId,
            name: calculatedSphere.name,
            reservoirConfigId: reservoirInput.reservoirConfigId,
            // 6 champs d'entrée
            hauteur: calculatedSphere.hauteur,
            temperature: calculatedSphere.temperature,
            temperatureVapeur: calculatedSphere.temperatureVapeur,
            volumeLiquide: calculatedSphere.volumeLiquide,
            pressionInterne: calculatedSphere.pressionInterne,
            densiteA15C: calculatedSphere.densiteA15C,
            tankPercentage: 0,
            // 6 champs calculés
            facteurCorrectionLiquide: calculatedSphere.facteurCorrectionLiquide,
            facteurCorrectionVapeur: calculatedSphere.facteurCorrectionVapeur,
            densiteAmbiante: calculatedSphere.densiteAmbiante,
            poidsLiquide: calculatedSphere.poidsLiquide,
            poidsGaz: calculatedSphere.poidsGaz,
            poidsTotal: calculatedSphere.poidsTotal
          };

          stockFinalPhysique += calculatedSphere.poidsLiquide;
        }

        // Créer dans la DB
        await tx.reservoir.create({ data: reservoirData });
      }

      // Calculs finaux
      const stockFinalTheorique =
        inventory.stockInitialPhysique +
        totalAppro -
        cumulSortie;

      const ecart = stockFinalPhysique - stockFinalTheorique;
      const ecartPourcentage = stockFinalTheorique !== 0 
        ? (ecart / stockFinalTheorique) * 100 
        : 0;

      const rendement = tempsTotal > 0
        ? ((tempsTotal - inventory.tempsArret) / tempsTotal) * 100
        : 0;

      // Save dynamic approValues
      if (data.approValues && typeof data.approValues === 'object') {
        // Get field configs for this center
        const approFields = await tx.approFieldConfig.findMany({
          where: { productionCenterId: inventory.productionCenterId || undefined }
        });

        // Create a map of field names to IDs
        const fieldMap = new Map(approFields.map(f => [f.name, f.id]));

        // Upsert each value (update if exists, create if not)
        for (const [fieldName, value] of Object.entries(data.approValues)) {
          const fieldConfigId = fieldMap.get(fieldName);
          if (fieldConfigId) {
            await tx.approValue.upsert({
              where: {
                inventoryId_fieldConfigId: {
                  inventoryId,
                  fieldConfigId
                }
              },
              create: {
                inventoryId,
                fieldConfigId,
                value: Number(value) || 0
              },
              update: {
                value: Number(value) || 0
              }
            });
          }
        }
      }

      // Save dynamic sortieValues
      if (data.sortieValues && typeof data.sortieValues === 'object') {
        // Get field configs for this center
        const sortieFields = await tx.sortieFieldConfig.findMany({
          where: { productionCenterId: inventory.productionCenterId || undefined }
        });

        // Create a map of field names to IDs
        const fieldMap = new Map(sortieFields.map(f => [f.name, f.id]));

        // Upsert each value (update if exists, create if not)
        for (const [fieldName, value] of Object.entries(data.sortieValues)) {
          const fieldConfigId = fieldMap.get(fieldName);
          if (fieldConfigId) {
            await tx.sortieValue.upsert({
              where: {
                inventoryId_fieldConfigId: {
                  inventoryId,
                  fieldConfigId
                }
              },
              create: {
                inventoryId,
                fieldConfigId,
                value: Number(value) || 0
              },
              update: {
                value: Number(value) || 0
              }
            });
          }
        }
      }

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
          observations: data.observations,
          densiteAmbiante: data.densiteAmbiante || null
        },
        include: {
          bottles: true,
          reservoirs: true,
          arrets: true,
          approValues: {
            include: {
              fieldConfig: true
            }
          },
          sortieValues: {
            include: {
              fieldConfig: true
            }
          }
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur clôture inventaire:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}