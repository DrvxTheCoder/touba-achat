import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { approveODM } from '@/app/api/odm/utils/odm-util';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { role } = session.user;
    if (!['DIRECTEUR', 'DIRECTEUR_GENERAL'].includes(role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const updatedODM = await approveODM(id, parseInt(session.user.id), role);

    return NextResponse.json(updatedODM);
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'ODM:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}