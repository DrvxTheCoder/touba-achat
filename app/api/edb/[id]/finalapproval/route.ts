// api/edb/[id]/finalapproval/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus, NotificationType, EDBEventType } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { finalApproveEDB } from '../../utils/edbAuditLogUtil';
import { sendNotification } from '@/app/actions/sendNotification';
import { generateNotificationMessage } from '@/app/api/utils/notificationMessage';
import { determineRecipients } from '@/app/api/utils/notificationsUtil';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { department: true, category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB non trouvé' }, { status: 404 });
    }

    // Check if the EDB is in the correct state for final approval
    if (edb.status !== 'SUPPLIER_CHOSEN') {
      return NextResponse.json({ message: 'L\'EDB n\'est pas en attente d\'approbation finale' }, { status: 400 });
    }


    const updatedEdb = await finalApproveEDB(Number(id), parseInt(session.user.id));

    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Erreur lors de l\'approbation finale de l\'EDB:', error);
    return NextResponse.json({ message: 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.' }, { status: 500 });
  }
}