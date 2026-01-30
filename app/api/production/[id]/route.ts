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
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const inventory = await prisma.productionInventory.findUnique({
      where: { id: inventoryId },
      include: {
        productionCenter: {
          select: { id: true, name: true }
        },
        startedBy: { select: { id: true, name: true, email: true } },
        completedBy: { select: { id: true, name: true, email: true } },
        arrets: {
          orderBy: { createdAt: 'asc' },
          include: { createdBy: { select: { id: true, name: true } } }
        },
        bottles: { orderBy: { type: 'asc' } },
        reservoirs: { orderBy: { name: 'asc' } },
        approValues: {
          include: {
            fieldConfig: true
          }
        },
        sortieValues: {
          include: {
            fieldConfig: true
          }
        }
      }
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventaire non trouve' }, { status: 404 });
    }

    if (inventory.status === 'EN_COURS') {
      const now = new Date();
      const tempsEcoule = Math.floor(
        (now.getTime() - new Date(inventory.startedAt).getTime()) / 60000
      );
      return NextResponse.json({ ...inventory, tempsEcoule });
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const existing = await prisma.productionInventory.findUnique({
      where: { id: inventoryId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Inventaire non trouve' }, { status: 404 });
    }

    if (existing.status !== 'EN_COURS') {
      return NextResponse.json(
        { error: 'Impossible de modifier un inventaire termine' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const updateData: any = {};

    if (data.butanier !== undefined) updateData.butanier = data.butanier;
    if (data.recuperation !== undefined) updateData.recuperation = data.recuperation;
    if (data.approSAR !== undefined) updateData.approSAR = data.approSAR;
    if (data.ngabou !== undefined) updateData.ngabou = data.ngabou;
    if (data.exports !== undefined) updateData.exports = data.exports;
    if (data.divers !== undefined) updateData.divers = data.divers;
    if (data.observations !== undefined) updateData.observations = data.observations;

    const updated = await prisma.productionInventory.update({
      where: { id: inventoryId },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission refusee' }, { status: 403 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const existing = await prisma.productionInventory.findUnique({
      where: { id: inventoryId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Inventaire non trouve' }, { status: 404 });
    }

    if (existing.status === 'TERMINE') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un inventaire termine' },
        { status: 400 }
      );
    }

    await prisma.productionInventory.delete({
      where: { id: inventoryId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
