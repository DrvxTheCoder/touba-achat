import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/production/bottle-stats - Get bottle production statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // week, month, year
    const centerId = searchParams.get('centerId');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        // Start of current week (Monday)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        // Start of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Build where clause
    const where: any = {
      status: 'TERMINE',
      completedAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (centerId && centerId !== 'null') {
      where.productionCenterId = parseInt(centerId);
    }

    // Fetch completed inventories for the period
    const inventories = await prisma.productionInventory.findMany({
      where,
      include: {
        bottles: true,
      },
    });

    // Aggregate bottle data by type
    const bottleStats = new Map<string, { quantity: number; tonnage: number }>();

    inventories.forEach((inventory) => {
      inventory.bottles?.forEach((bottle) => {
        const existing = bottleStats.get(bottle.type) || { quantity: 0, tonnage: 0 };
        bottleStats.set(bottle.type, {
          quantity: existing.quantity + bottle.quantity,
          tonnage: existing.tonnage + bottle.tonnage,
        });
      });
    });

    // Convert to array format
    const result = Array.from(bottleStats.entries()).map(([type, stats]) => ({
      type,
      quantity: stats.quantity,
      tonnage: stats.tonnage,
    }));

    // Sort by tonnage descending
    result.sort((a, b) => b.tonnage - a.tonnage);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur récupération statistiques bouteilles:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
