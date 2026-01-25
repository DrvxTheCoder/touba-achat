import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!session.user.access?.includes('VALIDATE_PRODUCTION_INVENTORY')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const centerId = parseInt(params.id);
    const { numberOfLines, capacityPerLine, totalHourlyCapacity } = await req.json();

    // Validate input
    if (!numberOfLines || !capacityPerLine || !totalHourlyCapacity) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (numberOfLines < 1) {
      return NextResponse.json(
        { error: 'Le nombre de lignes doit être au moins 1' },
        { status: 400 }
      );
    }

    if (capacityPerLine <= 0) {
      return NextResponse.json(
        { error: 'La capacité par ligne doit être supérieure à 0' },
        { status: 400 }
      );
    }

    // Update center capacity
    const center = await prisma.productionCenter.update({
      where: { id: centerId },
      data: {
        numberOfLines,
        capacityPerLine,
        totalHourlyCapacity,
      },
    });

    return NextResponse.json(center);
  } catch (error: any) {
    console.error('Error updating capacity:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
