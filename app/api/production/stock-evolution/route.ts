import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

type Period = 'week' | 'month' | 'quarter' | 'year';

// GET /api/production/stock-evolution - Get stock evolution data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || 'month') as Period;
    const centerId = searchParams.get('centerId');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    // Build where clause
    const where: any = {
      status: 'TERMINE',
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (centerId && centerId !== 'null') {
      where.productionCenterId = parseInt(centerId);
    }

    // Fetch completed inventories
    const inventories = await prisma.productionInventory.findMany({
      where,
      select: {
        date: true,
        stockFinalPhysique: true,
        stockFinalTheorique: true,
        ecart: true,
        completedAt: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Transform data for chart
    const chartData = inventories.map((inv) => ({
      date: inv.date.toISOString(),
      stockPhysique: inv.stockFinalPhysique || 0,
      stockTheorique: inv.stockFinalTheorique || 0,
      ecart: inv.ecart || 0,
    }));

    return NextResponse.json(chartData);
  } catch (error: any) {
    console.error('Erreur récupération évolution stock:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
