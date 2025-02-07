// api/dashboard/bdc-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role, BDCStatus } from '@prisma/client';
import { getDateRange } from '../edb-data/utils/utils';

const PENDING_STATUSES: BDCStatus[] = [
  'SUBMITTED',
  'APPROVED_RESPONSABLE',
  'APPROVED_DIRECTEUR',
] as const;

const APPROVED_STATUSES: BDCStatus[] = [
  'APPROVED_DAF',
] as const;

const COMPLETED_STATUSES: BDCStatus[] = [
  'PRINTED',
] as const;

const FULL_ACCESS_ROLES = [
  Role.DIRECTEUR_GENERAL,
  Role.ADMIN,
  Role.AUDIT,
  Role.DAF
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

    const [total, pending, approved, completed] = await Promise.all([
      prisma.bonDeCaisse.count({
        where: baseWhere
      }),
      prisma.bonDeCaisse.count({
        where: {
          ...baseWhere,
          status: { in: PENDING_STATUSES },
        },
      }),
      prisma.bonDeCaisse.count({
        where: {
          ...baseWhere,
          status: { in: APPROVED_STATUSES },
        },
      }),
      prisma.bonDeCaisse.count({
        where: {
          ...baseWhere,
          status: { in: COMPLETED_STATUSES },
        },
      }),
    ]);

    // Calculate total amount for printed BDCs
    const totalAmount = await prisma.bonDeCaisse.aggregate({
      where: {
        ...baseWhere,
        status: 'PRINTED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      metrics: {
        total,
        pending,
        approved,
        completed,
        totalAmount: totalAmount._sum.totalAmount || 0,
      },
      timeRange,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 });
  }
}