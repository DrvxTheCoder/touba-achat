import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/production/metrics - Get production metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get('centerId');

    // Get current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Build where clause
    const where: any = {
      status: 'TERMINE',
      completedAt: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    };

    if (centerId && centerId !== 'null') {
      where.productionCenterId = parseInt(centerId);
    }

    // Fetch completed inventories for the month
    const inventories = await prisma.productionInventory.findMany({
      where,
      include: {
        reservoirs: true,
        bottles: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Get latest inventory for current stock
    const latestInventory = inventories.length > 0 ? inventories[0] : null;

    // Get reservoir configs to calculate total capacity
    const reservoirWhere = centerId && centerId !== 'null'
      ? { productionCenterId: parseInt(centerId) }
      : {};

    const reservoirConfigs = await prisma.reservoirConfig.findMany({
      where: reservoirWhere,
    });

    const capaciteTotale = reservoirConfigs.reduce((sum, r) => sum + r.capacity, 0);

    // Calculate metrics
    const stockPhysiqueActuel = latestInventory?.stockFinalPhysique || 0;

    // Total bottles produced (quantity)
    const totalBottlesProduced = inventories.reduce((sum, inv) => sum + inv.totalBottlesProduced, 0);

    // Cumul Conditionee (total bottle tonnage in tonnes)
    const cumulConditionee = inventories.reduce((sum, inv) => {
      const bottleTonnage = inv.bottles?.reduce((bSum, bottle) => bSum + (bottle.tonnage || 0), 0) || 0;
      return sum + bottleTonnage;
    }, 0);

    // Calculate Rendement Horaire Moyen using TU and bottle tonnage only
    let totalRH = 0;
    let validRHCount = 0;
    inventories.forEach((inv) => {
      if (inv.tempsUtile && inv.tempsUtile > 0) {
        const bottleTonnage = inv.bottles?.reduce((sum, bottle) => sum + (bottle.tonnage || 0), 0) || 0;
        const hoursWorked = inv.tempsUtile / 60;
        const rh = bottleTonnage / hoursWorked;
        totalRH += rh;
        validRHCount++;
      }
    });
    const rendementHoraireMoyen = validRHCount > 0 ? totalRH / validRHCount : 0;

    // Calculate % 24T moyen
    const pourcentage24TMoyen = rendementHoraireMoyen > 0 ? (rendementHoraireMoyen / 24) * 100 : 0;

    // Temps Total de Production (in minutes)
    const tempsTotal = inventories.reduce((sum, inv) => sum + inv.tempsTotal, 0);

    // Temps Utile (in minutes)
    const tempsUtile = inventories.reduce((sum, inv) => sum + inv.tempsUtile, 0);

    // Écart Moyen (in tonnes)
    const ecartMoyenTonnes = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.ecart || 0), 0)
      : 0;

    // Écart Moyen (in percentage)
    const ecartMoyenPourcentage = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.ecartPourcentage || 0), 0) / inventories.length
      : 0;

    // Creux Moyen (in tonnes)
    const capaciteTotaleEnTonnes = capaciteTotale * 0.51;
    const creuxMoyen = inventories.length > 0
      ? inventories.reduce((sum, inv) => {
          const creux = capaciteTotaleEnTonnes - (inv.stockFinalPhysique || 0);
          return sum + creux;
        }, 0) / inventories.length
      : 0;

    // Cumul Sortie breakdown (in tonnes)
    const cumulSortieBottles = cumulConditionee; // Already calculated above
    const cumulSortieNgabou = inventories.reduce((sum, inv) => sum + inv.ngabou, 0);
    const cumulSortieExports = inventories.reduce((sum, inv) => sum + inv.exports, 0);
    const cumulSortieDivers = inventories.reduce((sum, inv) => sum + inv.divers, 0);
    const cumulSortieTotal = cumulSortieBottles + cumulSortieNgabou + cumulSortieExports + cumulSortieDivers;

    const tempsArretTotal = inventories.reduce((sum, inv) => sum + inv.tempsArret, 0);
    const inventairesTermines = inventories.length;

    // Old metrics for backwards compatibility
    const rendementMoyen = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.rendement || 0), 0) / inventories.length
      : 0;

    return NextResponse.json({
      // Legacy metrics
      stockPhysiqueActuel,
      capaciteTotale: capaciteTotaleEnTonnes,
      productionJour: totalBottlesProduced, // Kept for backwards compatibility
      rendementMoyen,
      ecartMoyen: ecartMoyenPourcentage,
      tempsArretTotal,
      inventairesTermines,

      // New metrics for redesigned dashboard
      totalBottlesProduced,
      cumulConditionee,
      rendementHoraireMoyen,
      pourcentage24TMoyen,
      tempsTotal,
      tempsUtile,
      ecartMoyenTonnes,
      ecartMoyenPourcentage,
      creuxMoyen,
      cumulSortie: {
        bottles: cumulSortieBottles,
        ngabou: cumulSortieNgabou,
        exports: cumulSortieExports,
        divers: cumulSortieDivers,
        total: cumulSortieTotal,
      },
    });
  } catch (error: any) {
    console.error('Erreur récupération métriques:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
