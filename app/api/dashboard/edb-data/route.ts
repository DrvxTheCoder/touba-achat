// api/dashboard/edb-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role, EDBStatus } from '@prisma/client';
import { getDateRange } from './utils/utils';

const ACTIVE_STATUSES: EDBStatus[] = [
  'APPROVED_DIRECTEUR',
  'APPROVED_DG',
  'MAGASINIER_ATTACHED',
  'SUPPLIER_CHOSEN',
  'COMPLETED',
  'FINAL_APPROVAL'
] as const;

const PENDING_STATUSES: EDBStatus[] = [
  'SUBMITTED',
  'ESCALATED',
  'APPROVED_RESPONSABLE'
] as const;

// Define the roles that have full access as a const array
const FULL_ACCESS_ROLES = [
  Role.DIRECTEUR_GENERAL,
  Role.ADMIN,
  Role.AUDIT,
  Role.MAGASINIER
] as const;

// Type guard to check if a role has full access
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

    // Base where clause with date range
    let baseWhere: any = {
      createdAt: dateRange,
    };

    // Add department filter for roles that should only see their department's data
    if (!hasFullAccess(role)) {
      const departmentId = user.employee?.currentDepartmentId;
      
      if (!departmentId) {
        return NextResponse.json({ 
          error: 'Département non trouvé pour l\'utilisateur' 
        }, { status: 400 });
      }

      baseWhere.departmentId = departmentId;

      // Special case for IT_ADMIN
      if (role === Role.IT_ADMIN) {
        baseWhere = {
          AND: [
            { createdAt: dateRange },
            {
              OR: [
                { departmentId: departmentId },
                { 
                  category: { 
                    name: { 
                      in: ['Logiciels et licences', 'Matériel informatique'] 
                    } 
                  } 
                }
              ]
            }
          ]
        };
      }
    }

    // Get metrics for each time range
    const [total, active, pending] = await Promise.all([
      prisma.etatDeBesoin.count({
        where: baseWhere
      }),
      prisma.etatDeBesoin.count({
        where: {
          ...baseWhere,
          status: { in: ACTIVE_STATUSES },
        },
      }),
      prisma.etatDeBesoin.count({
        where: {
          ...baseWhere,
          status: { in: PENDING_STATUSES },
        },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        total,
        active,
        pending,
      },
      timeRange,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 });
  }
}