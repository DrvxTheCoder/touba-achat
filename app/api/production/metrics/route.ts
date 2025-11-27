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
    const productionJour = inventories.reduce((sum, inv) => sum + inv.totalBottlesProduced, 0);

    const rendementMoyen = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.rendement || 0), 0) / inventories.length
      : 0;

    const ecartMoyen = inventories.length > 0
      ? inventories.reduce((sum, inv) => sum + (inv.ecartPourcentage || 0), 0) / inventories.length
      : 0;

    const tempsArretTotal = inventories.reduce((sum, inv) => sum + inv.tempsArret, 0);
    const inventairesTermines = inventories.length;

    // Convert capacity from m³ to tonnes (approximate conversion using GPL density ~0.51)
    const capaciteTotaleEnTonnes = capaciteTotale * 0.51;

    return NextResponse.json({
      stockPhysiqueActuel,
      capaciteTotale: capaciteTotaleEnTonnes,
      productionJour,
      rendementMoyen,
      ecartMoyen,
      tempsArretTotal,
      inventairesTermines,
    });
  } catch (error: any) {
    console.error('Erreur récupération métriques:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
