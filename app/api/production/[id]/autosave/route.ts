import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

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

    const data = await req.json();

    // Verify inventory exists and is in progress
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

    // Update basic fields only (not final calculations)
    const updateData: any = {};
    if (data.butanier !== undefined) updateData.butanier = data.butanier;
    if (data.recuperation !== undefined) updateData.recuperation = data.recuperation;
    if (data.approSAR !== undefined) updateData.approSAR = data.approSAR;
    if (data.ngabou !== undefined) updateData.ngabou = data.ngabou;
    if (data.exports !== undefined) updateData.exports = data.exports;
    if (data.divers !== undefined) updateData.divers = data.divers;
    if (data.observations !== undefined) updateData.observations = data.observations;

    await prisma.productionInventory.update({
      where: { id: inventoryId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur autosave:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
