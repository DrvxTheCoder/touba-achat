import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { createODM } from '@/app/api/odm/utils/odm-util';
import prisma from '@/lib/prisma';
import { ODMStatus, Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { role } = session.user;
    if (!['RESPONSABLE', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'RH'].includes(role)) {
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

    let where: any = status ? { status } : {};

    // Add time range filtering
    const now = new Date();
    switch (timeRange) {
      case 'this-month':
        where.createdAt = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lte: now
        };
        break;
      case 'last-month':
        where.createdAt = {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lte: new Date(now.getFullYear(), now.getMonth(), 0)
        };
        break;
      case 'last-3-months':
        where.createdAt = {
          gte: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          lte: now
        };
        break;
      case 'this-year':
        where.createdAt = {
          gte: new Date(now.getFullYear(), 0, 1),
          lte: now
        };
        break;
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { odmId: { contains: search, mode: 'insensitive' } },
        { userCreator: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Role-based filtering
    if (session.user.role === 'RESPONSABLE') {
      where.userCreatorId = parseInt(session.user.id);
    } else if (session.user.role === 'DIRECTEUR') {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { employee: true }
      });
      where.departmentId = user?.employee?.currentDepartmentId;
    }
    // For DIRECTEUR_GENERAL, RH, and ADMIN, no additional filtering is needed

    const odms = await prisma.ordreDeMission.findMany({
      where,
      include: {
        creator: true,
        userCreator: true,
        department: true,
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