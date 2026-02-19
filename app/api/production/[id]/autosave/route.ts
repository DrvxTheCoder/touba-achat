import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { calculateSphereData, validateSphereInput, SphereInputData, calculatePercentageBased } from '@/lib/utils/sphereCalculations';

// Poids unitaires des bouteilles
const BOTTLE_WEIGHTS: Record<string, number> = {
  B2_7: 2.7,
  B6: 6,
  B9: 9,
  B12_5: 12.5,
  B12_5K: 12.5,
  B38: 38
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const data = await req.json();

    // Verify inventory exists and is in progress
    const existing = await prisma.productionInventory.findUnique({
      where: { id: inventoryId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Inventaire non trouve' }, { status: 404 });
    }

    if (existing.status !== 'EN_COURS') {
      return NextResponse.json(
        { error: 'Impossible de modifier un inventaire termine' },
        { status: 400 }
      );
    }

    // Use transaction to update everything atomically
    await prisma.$transaction(async (tx) => {
      // Update basic fields including time fields
      const updateData: any = {};
      if (data.butanier !== undefined) updateData.butanier = data.butanier;
      if (data.recuperation !== undefined) updateData.recuperation = data.recuperation;
      if (data.approSAR !== undefined) updateData.approSAR = data.approSAR;
      if (data.ngabou !== undefined) updateData.ngabou = data.ngabou;
      if (data.exports !== undefined) updateData.exports = data.exports;
      if (data.divers !== undefined) updateData.divers = data.divers;
      if (data.observations !== undefined) updateData.observations = data.observations;

      // Time fields
      if (data.heureDebut !== undefined) updateData.heureDebut = data.heureDebut;
      if (data.heureFin !== undefined) updateData.heureFin = data.heureFin;
      if (data.densiteAmbiante !== undefined) updateData.densiteAmbiante = data.densiteAmbiante;

      await tx.productionInventory.update({
        where: { id: inventoryId },
        data: updateData
      });

      // Handle dynamic approValues
      if (data.approValues && typeof data.approValues === 'object') {
        const approFields = await tx.approFieldConfig.findMany({
          where: { productionCenterId: existing.productionCenterId || undefined }
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

      // Handle dynamic sortieValues
      if (data.sortieValues && typeof data.sortieValues === 'object') {
        const sortieFields = await tx.sortieFieldConfig.findMany({
          where: { productionCenterId: existing.productionCenterId || undefined }
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

      // Handle bottles - delete existing and recreate
      if (data.bottles && Array.isArray(data.bottles)) {
        await tx.bottleProduction.deleteMany({
          where: { inventoryId }
        });

        for (const bottle of data.bottles) {
          if (!bottle.type || !BOTTLE_WEIGHTS[bottle.type]) continue;

          const tonnage = ((bottle.quantity || 0) * BOTTLE_WEIGHTS[bottle.type]) / 1000;

          await tx.bottleProduction.create({
            data: {
              inventoryId,
              type: bottle.type,
              quantity: bottle.quantity || 0,
              tonnage
            }
          });
        }
      }

      // Handle reservoirs - delete existing and recreate
      if (data.reservoirs && Array.isArray(data.reservoirs)) {
        await tx.reservoir.deleteMany({
          where: { inventoryId }
        });

        for (const reservoirInput of data.reservoirs) {
          if (!reservoirInput.reservoirConfigId) continue;

          // Fetch reservoir configuration to check calculation mode
          const reservoirConfig = await tx.reservoirConfig.findUnique({
            where: { id: reservoirInput.reservoirConfigId }
          });

          if (!reservoirConfig) continue;

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
              tankPercentage: 0,
              poidsLiquide: reservoirInput.poidsLiquide || 0,
              poidsGaz: 0,
              poidsTotal: reservoirInput.poidsLiquide || 0,
              facteurCorrectionLiquide: 1,
              facteurCorrectionVapeur: 1,
              densiteAmbiante: 0.5
            };
          } else if (reservoirConfig.calculationMode === 'PERCENTAGE_BASED') {
            // PERCENTAGE_BASED MODE: Calculate from tank percentage, capacity, and shared densité ambiante
            const tankPercentage = reservoirInput.tankPercentage || 0;
            const sharedDensiteAmbiante = data.densiteAmbiante || 0;
            const capacityM3 = reservoirConfig.capacity;

            const poidsLiquide = (tankPercentage > 0 && sharedDensiteAmbiante > 0)
              ? calculatePercentageBased(tankPercentage, capacityM3, sharedDensiteAmbiante)
              : (reservoirInput.poidsLiquide || 0);

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
          } else {
            // AUTOMATIC MODE: Try to calculate if all fields are valid
            const hasValidInputs =
              reservoirInput.hauteur > 0 &&
              reservoirInput.temperature >= 15.0 &&
              reservoirInput.temperature <= 36.0 &&
              reservoirInput.temperatureVapeur >= 15.0 &&
              reservoirInput.temperatureVapeur <= 36.0 &&
              reservoirInput.volumeLiquide > 0 &&
              reservoirInput.densiteA15C > 0;

            if (hasValidInputs) {
              try {
                const validationErrors = validateSphereInput(reservoirInput as SphereInputData, reservoirConfig.capacity);
                if (validationErrors.length === 0) {
                  const calculatedSphere = calculateSphereData(reservoirInput as SphereInputData, reservoirConfig.capacity);
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
                    tankPercentage: 0,
                    facteurCorrectionLiquide: calculatedSphere.facteurCorrectionLiquide,
                    facteurCorrectionVapeur: calculatedSphere.facteurCorrectionVapeur,
                    densiteAmbiante: calculatedSphere.densiteAmbiante,
                    poidsLiquide: calculatedSphere.poidsLiquide,
                    poidsGaz: calculatedSphere.poidsGaz,
                    poidsTotal: calculatedSphere.poidsTotal
                  };
                }
              } catch (error) {
                // Silently ignore calculation errors during autosave
              }
            }

            // If calculation failed or not possible, save raw input
            if (!reservoirData) {
              reservoirData = {
                inventoryId,
                name: reservoirInput.name,
                reservoirConfigId: reservoirInput.reservoirConfigId,
                hauteur: reservoirInput.hauteur || 0,
                temperature: reservoirInput.temperature || 20,
                temperatureVapeur: reservoirInput.temperatureVapeur || 20,
                volumeLiquide: reservoirInput.volumeLiquide || 0,
                pressionInterne: reservoirInput.pressionInterne || 0,
                densiteA15C: reservoirInput.densiteA15C || 0,
                tankPercentage: reservoirInput.tankPercentage || 0,
                poidsLiquide: reservoirInput.poidsLiquide || 0,
                poidsGaz: reservoirInput.poidsGaz || 0,
                poidsTotal: reservoirInput.poidsTotal || 0,
                facteurCorrectionLiquide: reservoirInput.facteurCorrectionLiquide || 0,
                facteurCorrectionVapeur: reservoirInput.facteurCorrectionVapeur || 0,
                densiteAmbiante: reservoirInput.densiteAmbiante || 0
              };
            }
          }

          await tx.reservoir.create({ data: reservoirData });
        }
      }
    });

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur autosave:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
