import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role, StockEDBStatus, EDBStatus, ODMStatus } from '@prisma/client';

type DashboardMetrics = {
  stockEdbs: {
    total: number;
    percentageChange: number;
  };
  standardEdbs: {
    total: number;
    percentageChange: number;
  };
  activeOdms: {
    total: number;
    percentageChange: number;
  };
};

const FULL_ACCESS_ROLES = [Role.MAGASINIER, Role.ADMIN, Role.DIRECTEUR_GENERAL] as const;
type FullAccessRole = typeof FULL_ACCESS_ROLES[number];

const hasFullAccess = (role: Role): boolean => {
  return FULL_ACCESS_ROLES.includes(role as FullAccessRole);
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id, 10) : session.user.id;
    const userRole = session.user.role;
    
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Get user's employee ID
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { employee: { select: { id: true } } }
    });
    
    const employeeId = employee?.employee?.id;

    // Base filters for different types of requests
    const stockEdbFilter = hasFullAccess(userRole) ? {} : { employeeId };
    const standardEdbFilter = hasFullAccess(userRole) ? {} : { creatorId: employeeId };
    const odmFilter = hasFullAccess(userRole) ? {} : { creatorId: employeeId };

    // Get Stock EDbs metrics
    const [currentStockEdbs, previousStockEdbs] = await Promise.all([
      prisma.stockEtatDeBesoin.count({
        where: {
          ...stockEdbFilter,
          createdAt: {
            gte: firstDayThisMonth,
            lt: firstDayNextMonth,
          },
        },
      }),
      prisma.stockEtatDeBesoin.count({
        where: {
          ...stockEdbFilter,
          createdAt: {
            gte: firstDayLastMonth,
            lt: firstDayThisMonth,
          },
        },
      }),
    ]);

    // Get Standard EDbs metrics
    const [currentStandardEdbs, previousStandardEdbs] = await Promise.all([
        prisma.etatDeBesoin.count({
          where: {
            ...standardEdbFilter,
            createdAt: {
              gte: firstDayThisMonth,
              lt: firstDayNextMonth,
            },
          },
        }),
        prisma.etatDeBesoin.count({
          where: {
            ...standardEdbFilter,
            createdAt: {
              gte: firstDayLastMonth,
              lt: firstDayThisMonth,
            },
          },
        }),
      ]);

    // Get active ODMs metrics
    const [currentActiveOdms, previousActiveOdms] = await Promise.all([
      prisma.ordreDeMission.count({
        where: {
          ...odmFilter,
          createdAt: {
            gte: firstDayThisMonth,
            lt: firstDayNextMonth,
          },
        //   NOT: {
        //     status: {
        //       in: [ODMStatus.COMPLETED, ODMStatus.REJECTED],
        //     },
        //   },
        },
      }),
      prisma.ordreDeMission.count({
        where: {
          ...odmFilter,
          createdAt: {
            gte: firstDayLastMonth,
            lt: firstDayThisMonth,
          },
          NOT: {
            status: {
              in: [ODMStatus.COMPLETED, ODMStatus.REJECTED],
            },
          },
        },
      }),
    ]);

    const metrics: DashboardMetrics = {
      stockEdbs: {
        total: currentStockEdbs,
        percentageChange: calculatePercentageChange(currentStockEdbs, previousStockEdbs),
      },
      standardEdbs: {
        total: currentStandardEdbs,
        percentageChange: calculatePercentageChange(currentStandardEdbs, previousStandardEdbs),
      },
      activeOdms: {
        total: currentActiveOdms,
        percentageChange: calculatePercentageChange(currentActiveOdms, previousActiveOdms),
      },
    };

    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    );
  }
}