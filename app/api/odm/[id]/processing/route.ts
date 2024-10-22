import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { processODMByRH } from '@/app/api/odm/utils/odm-util';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'RH') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const { missionCostPerDay, expenseItems, totalCost } = await req.json();

    const updatedODM = await processODMByRH(id, parseInt(session.user.id), { missionCostPerDay, expenseItems, totalCost });

    return NextResponse.json(updatedODM);
  } catch (error) {
    console.error('Erreur lors du traitement de l\'ODM:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const id = parseInt(params.id);

    const odm = await prisma.ordreDeMission.findUnique({
      where: { id },
      include: {
        creator: true,
        userCreator: true,
        department: true,
      },
    });

    if (!odm) {
      return NextResponse.json({ error: 'ODM non trouvé' }, { status: 404 });
    }

    return NextResponse.json(odm);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ODM:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}