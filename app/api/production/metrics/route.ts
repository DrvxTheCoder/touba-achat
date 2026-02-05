import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

type Period = 'day' | 'week' | 'month' | 'trimester' | 'year';

// GET /api/production/metrics - Get production metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get('centerId');
    const period = (searchParams.get('period') || 'month') as Period;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    // Build center filter
    const centerFilter: any = {};
    if (centerId && centerId !== 'null') {
      centerFilter.productionCenterId = parseInt(centerId);
    }

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (dateFromParam) {
      // Custom date range overrides period
      startDate = new Date(dateFromParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = dateToParam ? new Date(dateToParam) : new Date(dateFromParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'day') {
      // Find the latest completed inventory
      const latest = await prisma.productionInventory.findFirst({
        where: { status: 'TERMINE', ...centerFilter },
        orderBy: { completedAt: 'desc' },
        select: { date: true },
      });
      if (latest) {
        startDate = new Date(latest.date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(latest.date);
        endDate.setHours(23, 59, 59, 999);
      } else {
        return NextResponse.json(emptyMetrics());
      }
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'trimester':
          startDate = startOfQuarter(now);
          endDate = endOfQuarter(now);
          break;
        case 'year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'month':
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
      }
    }

    // Build where clause
    // Custom date ranges filter by inventory date (production day),
    // preset periods filter by completedAt for broader matching
    const dateFilter = dateFromParam
      ? { date: { gte: startDate, lte: endDate } }
      : { completedAt: { gte: startDate, lte: endDate } };

    const where: any = {
      status: 'TERMINE',
      ...dateFilter,
      ...centerFilter,
    };

    // Fetch completed inventories for the period
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
    const totalBottlesProduced = inventories.reduce((sum, inv) => sum + inv.totalBottlesProduced, 0);

    const cumulConditionee = inventories.reduce((sum, inv) => {
      const bottleTonnage = inv.bottles?.reduce((bSum, bottle) => bSum + (bottle.tonnage || 0), 0) || 0;
      return sum + bottleTonnage;
    }, 0);

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
    const pourcentage24TMoyen = rendementHoraireMoyen > 0 ? (rendementHoraireMoyen / 24) * 100 : 0;

    const tempsTotal = inventories.reduce((sum, inv) => sum + inv.tempsTotal, 0);
    const tempsUtile = inventories.reduce((sum, inv) => sum + inv.tempsUtile, 0);

    const ecartMoyenTonnes = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.ecart || 0), 0)
      : 0;

    const ecartMoyenPourcentage = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.ecartPourcentage || 0), 0) / inventories.length
      : 0;

    const capaciteTotaleEnTonnes = capaciteTotale * 0.51;
    const creuxMoyen = inventories.length > 0
      ? inventories.reduce((sum, inv) => {
          const creux = capaciteTotaleEnTonnes - (inv.stockFinalPhysique || 0);
          return sum + creux;
        }, 0) / inventories.length
      : 0;

    const cumulSortieBottles = cumulConditionee;
    const cumulSortieNgabou = inventories.reduce((sum, inv) => sum + inv.ngabou, 0);
    const cumulSortieExports = inventories.reduce((sum, inv) => sum + inv.exports, 0);
    const cumulSortieDivers = inventories.reduce((sum, inv) => sum + inv.divers, 0);
    const cumulSortieTotal = cumulSortieBottles + cumulSortieNgabou + cumulSortieExports + cumulSortieDivers;

    const tempsArretTotal = inventories.reduce((sum, inv) => sum + inv.tempsArret, 0);
    const inventairesTermines = inventories.length;

    const rendementMoyen = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.rendement || 0), 0) / inventories.length
      : 0;

    return NextResponse.json({
      stockPhysiqueActuel,
      capaciteTotale: capaciteTotaleEnTonnes,
      productionJour: totalBottlesProduced,
      rendementMoyen,
      ecartMoyen: ecartMoyenPourcentage,
      tempsArretTotal,
      inventairesTermines,
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

function emptyMetrics() {
  return {
    stockPhysiqueActuel: 0,
    capaciteTotale: 0,
    productionJour: 0,
    rendementMoyen: 0,
    ecartMoyen: 0,
    tempsArretTotal: 0,
    inventairesTermines: 0,
    totalBottlesProduced: 0,
    cumulConditionee: 0,
    rendementHoraireMoyen: 0,
    pourcentage24TMoyen: 0,
    tempsTotal: 0,
    tempsUtile: 0,
    ecartMoyenTonnes: 0,
    ecartMoyenPourcentage: 0,
    creuxMoyen: 0,
    cumulSortie: {
      bottles: 0,
      ngabou: 0,
      exports: 0,
      divers: 0,
      total: 0,
    },
  };
}
