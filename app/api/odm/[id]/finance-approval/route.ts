import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { approveByDOG, rejectODM, approveODMByFinance, rejectODMByFinance } from '../../utils/odm-util';
import prisma from '@/lib/prisma';

/**
 * DOG Approval Endpoint (replaces Finance Approval)
 * Handles DOG final approval (AWAITING_DOG_APPROVAL -> READY_FOR_PRINT)
 * Also handles legacy AWAITING_FINANCE_APPROVAL status
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check if user has DOG role or ODM_DOG_APPROVE access
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true, access: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const hasAccess = user.role === 'DOG' ||
      user.role === 'ADMIN' ||
      user.role === 'DAF' || // Legacy support
      user.access.includes('ODM_DOG_APPROVE');

    if (!hasAccess) {
      return NextResponse.json({
        error: 'Non autorisé - Seul le DOG peut donner l\'approbation finale'
      }, { status: 403 });
    }

    const { approved, reason } = await request.json();
    const odmId = Number(params.id);

    if (approved) {
      // Check the current status to use correct function
      const odm = await prisma.ordreDeMission.findUnique({
        where: { id: odmId },
        select: { status: true }
      });

      if (!odm) {
        return NextResponse.json({ error: 'ODM non trouvé' }, { status: 404 });
      }

      let updatedOdm;
      // Handle legacy status
      if (odm.status === 'AWAITING_FINANCE_APPROVAL') {
        updatedOdm = await approveODMByFinance(odmId, parseInt(session.user.id));
      } else {
        updatedOdm = await approveByDOG(odmId, parseInt(session.user.id));
      }

      return NextResponse.json({
        message: 'ODM approuvé par DOG, prêt pour impression',
        odm: updatedOdm
      });
    } else {
      const updatedOdm = await rejectODM(odmId, parseInt(session.user.id), reason);
      return NextResponse.json({
        message: 'ODM rejeté',
        odm: updatedOdm
      });
    }
  } catch (error) {
    console.error('Error in DOG approval:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
