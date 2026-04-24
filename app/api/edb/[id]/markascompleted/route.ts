import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { markEDBAsCompleted } from '../../utils/edbAuditLogUtil';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;
  const userRole = session.user.role;

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { department: true, category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB non trouvé' }, { status: 404 });
    }

    // Standard path: FINAL_APPROVAL → COMPLETED (any authorized user)
    // Temporary shortcut: APPROVED_DIRECTEUR → COMPLETED (MAGASINIER only, after director approval)
    const isFinalApprovalPath = edb.status === 'FINAL_APPROVAL';
    const isMagasinierShortcut = edb.status === 'APPROVED_DIRECTEUR' && userRole === 'MAGASINIER';

    if (!isFinalApprovalPath && !isMagasinierShortcut) {
      return NextResponse.json({ message: 'Action impossible à cette étape' }, { status: 400 });
    }

    const completedEDB = await markEDBAsCompleted(edb.id, parseInt(session.user.id));

    return NextResponse.json({ message: 'EDB marqué comme traité', edb: completedEDB });
  } catch (error) {
    console.error('Erreur lors du marquage de l\'EDB comme traité:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}