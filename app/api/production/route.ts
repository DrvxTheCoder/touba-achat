import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schéma de validation pour la création d'un inventaire
const createInventorySchema = z.object({
  date: z.string().datetime(),
  stockInitialPhysique: z.number().min(0),
});

// POST - Démarrer une nouvelle journée de production
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier la permission
    if (!session.user.access?.includes('CREATE_PRODUCTION_INVENTORY')) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createInventorySchema.parse(body);

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Vérifier si un inventaire existe déjà pour cette date
    const existing = await prisma.productionInventory.findUnique({
      where: { date }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un inventaire existe déjà pour cette date', inventory: existing },
        { status: 409 }
      );
    }

    // Créer le nouvel inventaire
    const inventory = await prisma.productionInventory.create({
      data: {
        date,
        stockInitialPhysique: data.stockInitialPhysique,
        startedById: parseInt(session.user.id),
        status: 'EN_COURS',
        tempsTotal: 0,
        tempsArret: 0,
        tempsUtile: 0,
      },
      include: {
        startedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('Erreur création inventaire:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET - Lister les inventaires avec filtres et pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Construire le filtre
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Récupérer les données avec pagination
    const [inventories, total] = await Promise.all([
      prisma.productionInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          startedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          completedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              arrets: true,
              bottles: true
            }
          }
        }
      }),
      prisma.productionInventory.count({ where })
    ]);

    return NextResponse.json({
      data: inventories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération inventaires:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}