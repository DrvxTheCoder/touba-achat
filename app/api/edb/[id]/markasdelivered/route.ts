import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { markEDBAsDelivered } from '@/app/api/edb/utils/edbAuditLogUtil';
import { prisma } from '@/lib/prisma';
import { Access } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });

  if (!user || 
      user.role !== 'MAGASINIER' || 
      !user.access.includes(Access.ATTACH_DOCUMENTS)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  const edbId = parseInt(params.id);

  if (isNaN(edbId)) {
    return NextResponse.json({ error: 'ID EDB invalide' }, { status: 400 });
  }

  try {
    const updatedEDB = await markEDBAsDelivered(edbId, user.id);
    return NextResponse.json(updatedEDB);
  } catch (error) {
    console.error('Erreur lors du marquage de l\'EDB comme livré:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}