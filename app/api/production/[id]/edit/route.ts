import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { calculateSphereData, validateSphereInput, SphereInputData } from '@/lib/utils/sphereCalculations';
import { z } from 'zod';

// Poids unitaires des bouteilles
const BOTTLE_WEIGHTS: Record<string, number> = {
  B2_7: 2.7,
  B6: 6,
  B9: 9,
  B12_5: 12.5,
  B12_5K: 12.5,
  B38: 38
};

// PUT /api/production/[id]/edit - Edit a completed inventory
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission refusée - Seuls les administrateurs peuvent modifier les inventaires clôturés' }, { status: 403 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const data = await req.json();

    // Transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier inventaire existe
      const inventory = await tx.productionInventory.findUnique({
        where: { id: inventoryId },
        include: {
          bottles: true,
          reservoirs: true,
          approValues: true,
          sortieValues: true
        }
      });

      if (!inventory) {
        throw new Error('Inventaire non trouvé');
      }

      // Use manual time fields if provided
      const tempsTotal = data.tempsTotal || inventory.tempsTotal;

      // Calculate total appro and sorties from dynamic values
      const totalAppro = data.approValues
        ? Object.values(data.approValues).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
        : (data.butanier || 0) + (data.recuperation || 0) + (data.approSAR || 0);

      const totalSorties = data.sortieValues
        ? Object.values(data.sortieValues).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
        : (data.ngabou || 0) + (data.exports || 0) + (data.divers || 0);

      // Delete existing bottles and recreate
      await tx.bottleProduction.deleteMany({
        where: { inventoryId }
      });

      let totalBottles = 0;
      let cumulSortie = totalSorties;

      for (const bottle of data.bottles || []) {
        const weight = BOTTLE_WEIGHTS[bottle.type];
        if (!weight) continue;

        const tonnage = (bottle.quantity * weight) / 1000;

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

      // Delete existing reservoirs and recreate
      await tx.reservoir.deleteMany({
        where: { inventoryId }
      });

      let stockFinalPhysique = 0;
      for (const reservoirInput of data.reservoirs || []) {
        // Fetch reservoir configuration to check calculation mode
        const reservoirConfig = await tx.reservoirConfig.findUnique({
          where: { id: reservoirInput.reservoirConfigId }
        });

        if (!reservoirConfig) {
          throw new Error(`Configuration réservoir non trouvée pour ${reservoirInput.name}`);
        }

        let reservoirData;

        if (reservoirConfig.calculationMode === 'MANUAL') {
          // MANUAL MODE: Use poidsLiquide directly
          reservoirData = {
            inventoryId,
            name: reservoirInput.name,
            reservoirConfigId: reservoirInput.reservoirConfigId,
            hauteur: reservoirInput.hauteur || 0,
            temperature: reservoirInput.temperature || 20,
            temperatureVapeur: reservoirInput.temperatureVapeur || 20,
            volumeLiquide: reservoirInput.volumeLiquide || 0,
            pressionInterne: reservoirInput.pressionInterne || 0,
            densiteA15C: reservoirInput.densiteA15C || 0.5,
            poidsLiquide: reservoirInput.poidsLiquide || 0,
            poidsGaz: 0,
            poidsTotal: reservoirInput.poidsLiquide || 0,
            facteurCorrectionLiquide: 1,
            facteurCorrectionVapeur: 1,
            densiteAmbiante: 0.5
          };

          stockFinalPhysique += reservoirInput.poidsLiquide || 0;
        } else {
          // AUTOMATIC MODE: Validate and calculate
          const validationErrors = validateSphereInput(reservoirInput as SphereInputData);
          if (validationErrors.length > 0) {
            throw new Error(`Erreur validation réservoir ${reservoirInput.name}: ${validationErrors.join(', ')}`);
          }

          const calculatedSphere = calculateSphereData(reservoirInput as SphereInputData);

          reservoirData = {
            inventoryId,
            name: calculatedSphere.name,
            reservoirConfigId: reservoirInput.reservoirConfigId,
            hauteur: calculatedSphere.hauteur,
            temperature: calculatedSphere.temperature,
            temperatureVapeur: calculatedSphere.temperatureVapeur,
            volumeLiquide: calculatedSphere.volumeLiquide,
            pressionInterne: calculatedSphere.pressionInterne,
            densiteA15C: calculatedSphere.densiteA15C,
            facteurCorrectionLiquide: calculatedSphere.facteurCorrectionLiquide,
            facteurCorrectionVapeur: calculatedSphere.facteurCorrectionVapeur,
            densiteAmbiante: calculatedSphere.densiteAmbiante,
            poidsLiquide: calculatedSphere.poidsLiquide,
            poidsGaz: calculatedSphere.poidsGaz,
            poidsTotal: calculatedSphere.poidsTotal
          };

          stockFinalPhysique += calculatedSphere.poidsLiquide;
        }

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

      const tempsArret = inventory.tempsArret || 0;
      const rendement = tempsTotal > 0
        ? ((tempsTotal - tempsArret) / tempsTotal) * 100
        : 0;

      // Update dynamic approValues
      if (data.approValues && typeof data.approValues === 'object') {
        const approFields = await tx.approFieldConfig.findMany({
          where: { productionCenterId: inventory.productionCenterId || undefined }
        });

        const fieldMap = new Map(approFields.map(f => [f.name, f.id]));

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

      // Update dynamic sortieValues
      if (data.sortieValues && typeof data.sortieValues === 'object') {
        const sortieFields = await tx.sortieFieldConfig.findMany({
          where: { productionCenterId: inventory.productionCenterId || undefined }
        });

        const fieldMap = new Map(sortieFields.map(f => [f.name, f.id]));

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

      // Update the inventory
      const updated = await tx.productionInventory.update({
        where: { id: inventoryId },
        data: {
          butanier: data.butanier ?? inventory.butanier,
          recuperation: data.recuperation ?? inventory.recuperation,
          approSAR: data.approSAR ?? inventory.approSAR,
          ngabou: data.ngabou ?? inventory.ngabou,
          exports: data.exports ?? inventory.exports,
          divers: data.divers ?? inventory.divers,
          cumulSortie,
          stockFinalTheorique,
          stockFinalPhysique,
          ecart,
          ecartPourcentage,
          rendement,
          totalBottlesProduced: totalBottles,
          heureDebut: data.heureDebut ?? inventory.heureDebut,
          heureFin: data.heureFin ?? inventory.heureFin,
          tempsTotal,
          tempsUtile: tempsTotal - tempsArret,
          observations: data.observations ?? inventory.observations
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
          },
          productionCenter: true,
          startedBy: { select: { id: true, name: true, email: true } },
          completedBy: { select: { id: true, name: true, email: true } }
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur modification inventaire:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
