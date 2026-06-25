import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const inventory = await prisma.productionInventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, status: true },
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventaire non trouvé' }, { status: 404 });
    }

    const body = await req.json();

    const {
      dechargesComm,
      dechargesLiv,
      chargesComm,
      chargesLiv,
      nonDechargesComm,
      nonDechargesLiv,
      dechargesNonChargesComm,
      dechargesNonChargesLiv,
      observations,
    }: {
      dechargesComm: number;
      dechargesLiv: number;
      chargesComm: number;
      chargesLiv: number;
      nonDechargesComm: number;
      nonDechargesLiv: number;
      dechargesNonChargesComm: number;
      dechargesNonChargesLiv: number;
      observations: string;
    } = body;

    const vehicleMovement = await prisma.vehicleMovement.upsert({
      where: { inventoryId },
      create: {
        inventoryId,
        dechargesComm: dechargesComm ?? 0,
        dechargesLiv: dechargesLiv ?? 0,
        chargesComm: chargesComm ?? 0,
        chargesLiv: chargesLiv ?? 0,
        nonDechargesComm: nonDechargesComm ?? 0,
        nonDechargesLiv: nonDechargesLiv ?? 0,
        dechargesNonChargesComm: dechargesNonChargesComm ?? 0,
        dechargesNonChargesLiv: dechargesNonChargesLiv ?? 0,
        observations: observations ?? null,
      },
      update: {
        dechargesComm: dechargesComm ?? 0,
        dechargesLiv: dechargesLiv ?? 0,
        chargesComm: chargesComm ?? 0,
        chargesLiv: chargesLiv ?? 0,
        nonDechargesComm: nonDechargesComm ?? 0,
        nonDechargesLiv: nonDechargesLiv ?? 0,
        dechargesNonChargesComm: dechargesNonChargesComm ?? 0,
        dechargesNonChargesLiv: dechargesNonChargesLiv ?? 0,
        observations: observations ?? null,
      },
    });

    return NextResponse.json(vehicleMovement);
  } catch (error) {
    console.error('Erreur sauvegarde mouvement véhicules:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
