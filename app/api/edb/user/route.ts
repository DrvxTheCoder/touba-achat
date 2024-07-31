// api/edb/user/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../auth/[...nextauth]/auth-options';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * pageSize;

    const statusFilter = status ? status.split(',') as EDBStatus[] : [];

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ error: 'Utilisateur ou employé non trouvé' }, { status: 400 });
    }

    let where: any = {
      creatorId: user.employee.id,
      OR: [
        { edbId: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { 
          description: {
            path: ['items'],
            array_contains: [{ designation: { contains: search } }]
          }
        },
      ],
      ...(statusFilter.length > 0 ? { status: { in: statusFilter } } : {}),
    };

    const [edbs, totalCount] = await Promise.all([
      prisma.etatDeBesoin.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          category: true,
          department: true,
          userCreator: true,
          orders: true,
          attachments: true,
          auditLogs: {
            include: {
              user: true
            },
            orderBy: {
              eventAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.etatDeBesoin.count({ where }),
    ]);

    const formattedEDBs = edbs.map(edb => ({
      id: edb.id,
      edbId: edb.edbId,
      title: edb.title,
      description: edb.description,
      status: edb.status,
      categoryId: edb.categoryId,
      category: edb.category.name,
      createdAt: edb.createdAt.toISOString(),
      updatedAt: edb.updatedAt.toISOString(),
      department: edb.department.name,
      creator: {
        name: edb.userCreator.name,
      },
      totalAmount: edb.orders.reduce((sum, order) => sum + order.amount, 0),
      auditLogs: edb.auditLogs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        eventAt: log.eventAt.toISOString(),
        user: {
          name: log.user.name,
        },
      })),
      attachments: edb.attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
      })),
    }));

    return NextResponse.json({
      data: formattedEDBs,
      total: totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des EDPs:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des EDPs' }, { status: 500 });
  }
}