import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { createODM } from '@/app/api/odm/utils/odm-util';
import prisma from '@/lib/prisma';
import { Prisma, ODMStatus, Role, EDBStatus } from '@prisma/client';


function getDateRange(timeRange: string): { gte: Date; lte: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeRange) {
    case 'today':
      return {
        gte: today,
        lte: now
      };
      
    case 'this-week': {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return {
        gte: monday,
        lte: now
      };
    }
      
    case 'this-month':
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: now
      };
      
    case 'last-month': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        gte: firstDayLastMonth,
        lte: lastDayLastMonth
      };
    }
      
    case 'last-3-months':
      return {
        gte: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        lte: now
      };
      
    case 'this-year':
      return {
        gte: new Date(now.getFullYear(), 0, 1),
        lte: now
      };
      
    case 'last-year':
      return {
        gte: new Date(now.getFullYear() - 1, 0, 1),
        lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      };
      
    default:
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: now
      };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { role } = session.user;
    if (!['RESPONSABLE', 'MAGASINIER', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'RH', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await req.json();
    const newODM = await createODM(parseInt(session.user.id), body);

    return NextResponse.json(newODM, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'ODM:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ODMStatus | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const timeRange = searchParams.get('timeRange') || 'this-month';
    const dateRange = getDateRange(timeRange);

    const statusFilter = status ? status.split(',') as ODMStatus[] : [];
    
      let where: Prisma.OrdreDeMissionWhereInput = {
          createdAt: dateRange,
          OR: [
            { odmId: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { userCreator: { name: { contains: search, mode: 'insensitive' } } },
            { userCreator: { email: { contains: search, mode: 'insensitive' } } },
            { department: { name: { contains: search, mode: 'insensitive' } } },
          ],
          ...(statusFilter.length > 0 ? { status: { in: statusFilter } } : {}),
        };



    // Role-based filtering
    if (session.user.role === 'RESPONSABLE') {
      where.userCreatorId = parseInt(session.user.id);
    } 
    if (session.user.role === 'DIRECTEUR') {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { employee: { include: { currentDepartment: true } } }
      });
        // Check if the director is from Direction Administrative et Financière
        switch (user?.employee?.currentDepartment.name) {
          case 'Direction Administrative et Financière':
            // Finance/DAF director - sees DOG approval and ready for print (legacy)
            where.OR = [
              { status: 'AWAITING_DOG_APPROVAL' },
              { status: 'AWAITING_FINANCE_APPROVAL' }, // Legacy
              { status: 'READY_FOR_PRINT' },
              { status: 'COMPLETED' }, // Legacy
              { status: 'REJECTED' },
              { departmentId: user.employee.currentDepartmentId }
            ];
            break;

          case 'Direction des Opérations Gaz':
            // DOG director - sees ODMs awaiting DOG approval
            where.OR = [
              { status: 'AWAITING_DOG_APPROVAL' },
              { status: 'READY_FOR_PRINT' },
              { status: 'REJECTED' },
              { departmentId: user.employee.currentDepartmentId }
            ];
            break;

          case 'Direction Ressources Humaines':
            // DRH director sees all ODMs (manages the workflow)
            break;

          default:
            // Other directors see only their department's ODMs
            where.departmentId = user?.employee?.currentDepartmentId;
            break;
        }
        
      // if (user?.employee?.currentDepartment?.name === 'Direction Administrative et Financière') {
      //   where.OR = [
      //     { status: 'AWAITING_FINANCE_APPROVAL' },
      //     { status: 'COMPLETED' },
      //     { status: 'REJECTED' },
      //     { departmentId: user.employee.currentDepartmentId }
      //   ];
      // }
      
      // // Check if the director is from not Ressources Humaines and apply filter
      // if (user?.employee?.currentDepartment?.name !== 'Direction Ressources Humaines') {
      //   where.departmentId = user?.employee?.currentDepartmentId;
      // } 
    }
    // For DIRECTEUR_GENERAL, RH, and ADMIN, no additional filtering is needed

    const odms = await prisma.ordreDeMission.findMany({
      where,
      include: {
        creator: true,
        userCreator: true,
        department: true,
        auditLogs: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.ordreDeMission.count({ where });

    return NextResponse.json({
      odms,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ODMs:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}