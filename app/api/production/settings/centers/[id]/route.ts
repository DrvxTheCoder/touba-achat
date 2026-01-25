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
        chefProduction: {
          select: {
            id: true,
            name: true,
            email: true,
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

    return NextResponse.json(center);
  } catch (error: any) {
    console.error('Error fetching center:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
