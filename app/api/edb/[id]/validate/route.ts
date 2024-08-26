// app/api/edb/[id]/validate/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { validateEDB } from '../../utils/edbAuditLogUtil';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;
  const { role, name, id: userId } = session.user;

  try {
    const updatedEdb = await validateEDB(Number(id), parseInt(userId), role, name || 'Utilisateur inconnu');
    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Error validating EDB:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json({ message: 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.' }, { status: 500 });
  }
}