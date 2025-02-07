import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { setEdbAsIT, undoSetEdbAsIT } from '../../utils/edbAuditLogUtil';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string} }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'set';

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { department: true, category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB non trouvé' }, { status: 404 });
    }

    if (action === 'undo') {
        const isUndoSetAsItEDB = await undoSetEdbAsIT(edb.id, parseInt(session.user.id));
        return NextResponse.json({ message: 'Action annulée', edb: isUndoSetAsItEDB });
    } else {
        const isSetAsItEDB = await setEdbAsIT(edb.id, parseInt(session.user.id));
        return NextResponse.json({ message: 'EDB marqué comme etant informatique', edb: isSetAsItEDB });
    }

  } catch (error) {
    console.error('Erreur lors de l\'opération:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}