import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { deleteODM } from '../../utils/odm-util';

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

  const odmId = parseInt(params.id);
  if (isNaN(odmId)) {
    return NextResponse.json({ error: 'ID ODM invalide' }, { status: 400 });
  }

  try {
    const odm = await prisma.ordreDeMission.findUnique({
      where: { id: odmId },
    });

    if (!odm) {
      return NextResponse.json({ error: 'ODM introuvable' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'ADMIN') {
      if (!['DRAFT', 'SUBMITTED'].includes(odm.status)) {
        return NextResponse.json(
          { error: 'La suppression n\'est possible que pour les ODMs non approuvés' },
          { status: 403 }
        );
      }

      // Ensure only creator can delete their own ODM
      if (odm.userCreatorId !== user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez supprimer que vos propres ODMs' },
          { status: 403 }
        );
      }
    }

    await deleteODM(odmId, user.id);
    return NextResponse.json({ message: 'ODM supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting ODM:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}