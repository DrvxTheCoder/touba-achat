import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { approveODM, approveODMByRHDirector } from '@/app/api/odm/utils/odm-util';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const odmId = parseInt(params.id);

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { action } = body || {};

    if (action === 'approveRHDirector') {
        // Check if the user is a DIRECTEUR and belongs to the "Direction Ressources Humaines" department
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId) },
          include: { employee: { include: { currentDepartment: true } } },
        });
  
        if (
          user?.role !== 'DIRECTEUR' ||
          user?.employee?.currentDepartment?.name !== 'Direction Ressources Humaines'
        ) {
          return NextResponse.json({ error: 'Non autorisé. Seul le Directeur des Ressources Humaines peut effectuer cette action.' }, { status: 403 });
        }
  
        const updatedODM = await approveODMByRHDirector(odmId, parseInt(userId));
        return NextResponse.json(updatedODM);
    } else {
      // Regular approval process
      if (!['DIRECTEUR', 'DIRECTEUR_GENERAL', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const updatedODM = await approveODM(odmId, parseInt(userId), role);
      return NextResponse.json({ message: 'ODM approuvé avec succès', odm: updatedODM });
    }
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'ODM:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: (error as Error).message }, { status: 500 });
  }
}