import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { deleteEDB } from '../../utils/edbAuditLogUtil';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  const edbId = parseInt(params.id);
  if (isNaN(edbId)) {
    return NextResponse.json({ error: 'ID EDB invalide' }, { status: 400 });
  }

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: edbId },
    });

    if (!edb) {
      return NextResponse.json({ error: 'EDB introuvable' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'ADMIN') {
      if (!['DRAFT', 'SUBMITTED'].includes(edb.status)) {
        return NextResponse.json(
          { error: 'La suppression n\'est possible que pour les EDBs non approuvés' },
          { status: 403 }
        );
      }

      // Ensure only creator can delete their own EDB
      if (edb.userCreatorId !== user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez supprimer que vos propres EDBs' },
          { status: 403 }
        );
      }
    }

    await deleteEDB(edbId, user.id);
    return NextResponse.json({ message: 'EDB supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting EDB:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}