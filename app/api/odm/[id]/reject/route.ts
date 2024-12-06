// api/edb/[id]/reject/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus, EDBEventType } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { rejectODM } from '../../utils/odm-util';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { role } = session.user;

  try {
    const body = await request.json();
    const { reason } = body;

    // if (!reason) {
    //   return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    // }

    const edb = await prisma.ordreDeMission.findUnique({
      where: { id: Number(id) },
    });

    if (!edb) {
      return NextResponse.json({ message: 'ODM introuvable' }, { status: 404 });
    }


    // Check if the user has the right to reject this EDB
    const canReject = await checkUserCanRejectODM(role, edb);
    if (!canReject) {
      return NextResponse.json({ message: 'Vous n\'êtes pas autorisé a rejeter cet ODM' }, { status: 403 });
    }

    // Update the EDB status to REJECTED, log the event, and add the rejection reason
    const updatedODM = await rejectODM(Number(id), parseInt(session.user.id), reason);

    return NextResponse.json(updatedODM);
  } catch (error) {
    console.error('Error rejecting ODM:', error);
    return NextResponse.json({ message: 'Erreur lors de la rejection ODM' }, { status: 500 });
  }
}


async function checkUserCanRejectODM(role: string, edb: any) {
    // Implement your logic here to check if the user can reject the EDB
    // This might involve checking the user's role, the EDB's current status, etc.
    if (['DIRECTEUR', 'DIRECTEUR_GENERAL', 'ADMIN'].includes(role)){
        return true;
    }
    else {
        return false;
    }
  }