// api/dashboard/odm-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role, ODMStatus } from '@prisma/client';
import { getDateRange } from './edb-data/utils/utils';

const ACTIVE_STATUSES: ODMStatus[] = [
  'AWAITING_RH_PROCESSING',
  'RH_PROCESSING',
] as const;

const PENDING_STATUSES: ODMStatus[] = [
  'SUBMITTED',
  'AWAITING_DIRECTOR_APPROVAL',
] as const;

const COMPLETED_STATUSES: ODMStatus[] = [
  'COMPLETED',
  'AWAITING_FINANCE_APPROVAL',
] as const;

const FULL_ACCESS_ROLES = [
  Role.DIRECTEUR_GENERAL,
  Role.ADMIN,
  Role.AUDIT,
  Role.RH
] as const;

function hasFullAccess(role: Role): boolean {
  return FULL_ACCESS_ROLES.includes(role as typeof FULL_ACCESS_ROLES[number]);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const timeRange = searchParams.get('timeRange') || 'this-month';

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employee: { include: { currentDepartment: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { role } = user;
    const dateRange = getDateRange(timeRange);

    let baseWhere: any = {
      createdAt: dateRange,
    };

    if (!hasFullAccess(role)) {
      const departmentId = user.employee?.currentDepartmentId;
      
      if (!departmentId) {
        return NextResponse.json({ 
          error: 'Département non trouvé pour l\'utilisateur' 
        }, { status: 400 });
      }

      baseWhere.departmentId = departmentId;
    }

    const [total, active, pending, completed] = await Promise.all([
      prisma.ordreDeMission.count({
        where: baseWhere
      }),
      prisma.ordreDeMission.count({
        where: {
          ...baseWhere,
          status: { in: ACTIVE_STATUSES },
        },
      }),
      prisma.ordreDeMission.count({
        where: {
          ...baseWhere,
          status: { in: PENDING_STATUSES },
        },
      }),
      prisma.ordreDeMission.count({
        where: {
          ...baseWhere,
          status: { in: COMPLETED_STATUSES },
        },
      }),
    ]);

    // Calculate total cost for completed ODMs
    const totalAmount = await prisma.ordreDeMission.aggregate({
      where: {
        ...baseWhere,
        totalCost: { not: null },
      },
      _sum: {
        totalCost: true,
      },
    });

    return NextResponse.json({
      metrics: {
        total,
        active,
        pending,
        completed,
        totalAmount: totalAmount._sum.totalCost || 0,
      },
      timeRange,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 });
  }
}