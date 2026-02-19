import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const centerId = parseInt(params.id);

    const center = await prisma.productionCenter.findUnique({
      where: { id: centerId },
      include: {
        chefProductions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        approFieldConfigs: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        sortieFieldConfigs: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            inventories: true,
            reservoirs: true,
          },
        },
      },
    });

    if (!center) {
      return NextResponse.json({ error: 'Centre non trouvé' }, { status: 404 });
    }

    // Transform to include backward-compatible chefProduction field
    const chefs = center.chefProductions?.map((cp) => cp.user) || [];
    const transformedCenter = {
      ...center,
      chefProduction: chefs[0] || null,
      chefProductions: chefs,
    };

    return NextResponse.json(transformedCenter);
  } catch (error: any) {
    console.error('Error fetching center:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
