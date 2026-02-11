import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schéma de validation pour la création d'un inventaire
const createInventorySchema = z.object({
  date: z.string().datetime(),
  stockInitialPhysique: z.number().min(0),
  productionCenterId: z.number().int().positive().optional(),
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

    // Vérifier si un inventaire existe déjà pour cette date ET ce centre
    const existing = data.productionCenterId
      ? await prisma.productionInventory.findUnique({
          where: {
            date_productionCenterId: {
              date,
              productionCenterId: data.productionCenterId
            }
          }
        })
      : await prisma.productionInventory.findFirst({
          where: {
            date,
            productionCenterId: null
          }
        });

    if (existing) {
      return NextResponse.json(
        { error: 'Un inventaire existe déjà pour cette date et ce centre', inventory: existing },
        { status: 409 }
      );
    }

    // Créer le nouvel inventaire
    const inventory = await prisma.productionInventory.create({
      data: {
        date,
        stockInitialPhysique: data.stockInitialPhysique,
        productionCenterId: data.productionCenterId || null,
        startedById: parseInt(session.user.id),
        status: 'EN_COURS',
        tempsTotal: 0,
        tempsArret: 0,
        tempsUtile: 0,
      },
      include: {
        productionCenter: {
          select: {
            id: true,
            name: true
          }
        },
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
    const centerId = searchParams.get('centerId');
    const search = searchParams.get('search')?.trim();

    const skip = (page - 1) * limit;

    // Privileged roles that can see all centers
    const PRIVILEGED_ROLES = ['ADMIN', 'DIRECTEUR_GENERAL', 'DOG', 'DIRECTEUR'];
    const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role);

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

    // Center-based access control
    if (!isPrivileged) {
      // Restricted user: find their assigned center
      const userCenter = await prisma.productionCenter.findFirst({
        where: { chefProductionId: parseInt(session.user.id) },
        select: { id: true }
      });
      if (userCenter) {
        where.productionCenterId = userCenter.id;
      } else {
        // User is not chef of any center — return empty
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }
    } else if (centerId) {
      // Privileged user with explicit center filter
      where.productionCenterId = parseInt(centerId);
    }

    // Search filter (by date or employee name)
    if (search) {
      // Try to parse as date (supports dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, or partial)
      const dateMatch = search.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
        const fullYear = year < 100 ? 2000 + year : year;
        const searchDate = new Date(fullYear, month - 1, day);
        searchDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.date = { gte: searchDate, lt: nextDay };
      } else {
        // Search by employee name (startedBy or completedBy)
        where.OR = [
          { startedBy: { name: { contains: search, mode: 'insensitive' } } },
          { completedBy: { name: { contains: search, mode: 'insensitive' } } }
        ];
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
          productionCenter: {
            select: {
              id: true,
              name: true
            }
          },
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