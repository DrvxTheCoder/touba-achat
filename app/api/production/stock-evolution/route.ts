import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

type Period = 'day' | 'week' | 'month' | 'trimester' | 'quarter' | 'year';

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
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    // Build center filter
    const centerFilter: any = {};
    if (centerId && centerId !== 'null') {
      centerFilter.productionCenterId = parseInt(centerId);
    }

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (dateFromParam) {
      startDate = new Date(dateFromParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = dateToParam ? new Date(dateToParam) : new Date(dateFromParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'day') {
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
        return NextResponse.json([]);
      }
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'trimester':
        case 'quarter':
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
    const dateFilter = dateFromParam
      ? { date: { gte: startDate, lte: endDate } }
      : { completedAt: { gte: startDate, lte: endDate } };

    const where: any = {
      status: 'TERMINE',
      ...dateFilter,
      ...centerFilter,
    };

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
