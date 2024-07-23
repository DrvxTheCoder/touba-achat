// app/api/edb/[id]/reject/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

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

    if (!reason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }

    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB introuvable' }, { status: 404 });
    }

    // Check if the user has the right to reject this EDB
    const canReject = await checkUserCanReject(role, edb);
    if (!canReject) {
      return NextResponse.json({ message: 'Vous n\'êtes pas autorisé a rejeter cet EDB ' }, { status: 403 });
    }

    // Update the EDB status to REJECTED and add the rejection reason
    const updatedEdb = await prisma.etatDeBesoin.update({
      where: { id: Number(id) },
      data: { 
        status: EDBStatus.REJECTED,
        approverId: parseInt(session.user.id),
        rejectionReason: reason,
      },
    });

    // You might want to create a notification or log this action
    await prisma.notification.create({
      data: {
        type: 'EDB_REJECTED',
        message: `EDB #${edb.edbId} a été rejeté. Raison: ${reason}`,
        senderId: parseInt(session.user.id),
        receiverId: edb.creatorId, // Notify the creator
        etatDeBesoinId: edb.id,
      },
    });

    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Error rejecting EDB:', error);
    return NextResponse.json({ message: 'Error rejecting EDB' }, { status: 500 });
  }
}

async function checkUserCanReject(role: string, edb: any) {
  // Implement your logic here to check if the user can reject the EDB
  // This might involve checking the user's role, the EDB's current status, etc.
  switch (role) {
    case 'RESPONSABLE':
      return ['SUBMITTED', 'APPROVED_RESPONSABLE'].includes(edb.status);
    case 'DIRECTEUR':
      return ['SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR'].includes(edb.status);
    case 'IT_ADMIN':
      return ['AWAITING_IT_APPROVAL'].includes(edb.status) && 
             ['Logiciels et licences', 'Matériel informatique'].includes(edb.category.name);
    case 'DIRECTEUR_GENERAL':
      return true; // Can reject at any stage
    default:
      return false;
  }
}