import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { editODMProcessing } from '@/app/api/odm/utils/odm-util';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'RH') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const { 
      missionCostPerDay, 
      expenseItems, 
      totalCost,
      accompanyingPersons // Add this
    } = await req.json();

    const updatedODM = await editODMProcessing(
      id, 
      parseInt(session.user.id), 
      { 
        missionCostPerDay, 
        expenseItems, 
        totalCost,
        accompanyingPersons // Include in the function call
      }
    );

    return NextResponse.json(updatedODM);
  } catch (error) {
    console.error('Erreur lors de la modification du traitement de l\'ODM:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' }, 
      { status: 500 }
    );
  }
}