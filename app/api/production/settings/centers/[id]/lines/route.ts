import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

// GET - List production lines for a center
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

    const lines = await prisma.productionLine.findMany({
      where: { productionCenterId: centerId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(lines);
  } catch (error: any) {
    console.error('Error fetching production lines:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Create a new production line
export async function POST(
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
    const { name, capacityPerHour } = await req.json();

    if (!name || !capacityPerHour) {
      return NextResponse.json(
        { error: 'Le nom et la capacité sont requis' },
        { status: 400 }
      );
    }

    if (capacityPerHour <= 0) {
      return NextResponse.json(
        { error: 'La capacité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    const line = await prisma.productionLine.create({
      data: {
        name,
        capacityPerHour,
        productionCenterId: centerId
      }
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une ligne avec ce nom existe déjà pour ce centre' },
        { status: 409 }
      );
    }
    console.error('Error creating production line:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Update a production line
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

    const { lineId, name, capacityPerHour, isActive } = await req.json();

    if (!lineId) {
      return NextResponse.json(
        { error: 'lineId est requis' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (capacityPerHour !== undefined) updateData.capacityPerHour = capacityPerHour;
    if (isActive !== undefined) updateData.isActive = isActive;

    const line = await prisma.productionLine.update({
      where: { id: lineId },
      data: updateData
    });

    return NextResponse.json(line);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une ligne avec ce nom existe déjà pour ce centre' },
        { status: 409 }
      );
    }
    console.error('Error updating production line:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a production line
export async function DELETE(
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

    const { searchParams } = new URL(req.url);
    const lineId = parseInt(searchParams.get('lineId') || '');

    if (isNaN(lineId)) {
      return NextResponse.json(
        { error: 'lineId est requis' },
        { status: 400 }
      );
    }

    await prisma.productionLine.delete({
      where: { id: lineId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting production line:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
