// app/api/dashboard/activity/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

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
    
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get EDB audit logs count
    const edbAuditCount = await prisma.etatDeBesoinAuditLog.count({
      where: {
        userId,
        eventAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    // Get ODM related actions (using status changes as actions)
    const odmActionsCount = await prisma.ordreDeMission.count({
      where: {
        OR: [
          { userCreatorId: userId },
          { approverId: userId },
        ],
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    // Get user's employee ID first
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { employee: { select: { id: true } } }
    });

    const employeeId = employee?.employee?.id;

    // Get Stock EDB actions
    const stockEdbCount = await prisma.stockEtatDeBesoin.count({
      where: {
        employeeId,
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    // Get previous month counts for percentage calculation
    const previousMonthEdbAudit = await prisma.etatDeBesoinAuditLog.count({
      where: {
        userId,
        eventAt: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      },
    });

    const totalCurrentMonth = edbAuditCount + odmActionsCount + stockEdbCount;
    const totalPreviousMonth = previousMonthEdbAudit; // Add other previous month counts if needed

    const percentageChange = totalPreviousMonth === 0 
      ? totalCurrentMonth > 0 ? 100 : 0
      : ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100;

    return NextResponse.json({
      data: [
        { type: "EDBs (std)", count: edbAuditCount, fill: "hsl(var(--chart-1))" },
        { type: "EDBs (stock)", count: stockEdbCount, fill: "hsl(var(--chart-2))" },
        { type: "ODMs", count: odmActionsCount, fill: "hsl(var(--chart-3))" },
      ],
      totalActions: totalCurrentMonth,
      percentageChange: Math.round(percentageChange),
    });
    
  } catch (error) {
    console.error('Error fetching activity metrics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    );
  }
}