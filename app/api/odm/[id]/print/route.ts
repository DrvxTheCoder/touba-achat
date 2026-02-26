import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { printODM } from '@/app/api/odm/utils/odm-util';

/**
 * POST /api/odm/[id]/print
 * Marks an ODM as printed (READY_FOR_PRINT -> COMPLETED)
 * Called automatically when the user closes the print document tab
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const odmId = parseInt(params.id);
    if (isNaN(odmId)) {
      return NextResponse.json({ error: 'ID ODM invalide' }, { status: 400 });
    }

    const updatedODM = await printODM(odmId, parseInt(session.user.id));

    return NextResponse.json({
      message: 'ODM marqué comme imprimé',
      odm: updatedODM
    });
  } catch (error) {
    console.error('Erreur lors du marquage comme imprimé:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
