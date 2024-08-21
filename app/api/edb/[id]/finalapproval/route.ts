import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus, NotificationType, EDBEventType } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { logEDBEvent } from '../../utils/edbAuditLogUtil';
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

    const newStatus: EDBStatus = 'FINAL_APPROVAL';
    const notificationType: NotificationType = NotificationType.EDB_FINAL_APPROVAL;
    const action: EDBEventType = EDBEventType.FINAL_APPROVAL;

    // Update the EDB status
    const updatedEdb = await prisma.etatDeBesoin.update({
      where: { id: Number(id) },
      data: { 
        status: newStatus,
        finalApprovedAt: new Date(),
        finalApprovedBy: parseInt(session.user.id)
      },
    });
    
    // Log the event
    await logEDBEvent(
      Number(id),
      parseInt(session.user.id),
      action,
      { oldStatus: edb.status, newStatus }
    );

    // Generate notification message
    const notificationMessage = generateNotificationMessage(action, {
      edbId: edb.edbId,
      status: newStatus,
      userName: session.user.name || 'Un utilisateur',
      departmentName: edb.department.name
    });

    // Determine recipients
    const recipients = await determineRecipients(updatedEdb, newStatus, parseInt(session.user.id));

    // Send notification
    await sendNotification({
      type: notificationType,
      message: notificationMessage,
      entityId: edb.edbId,
      entityType: 'EDB',
      recipients,
      additionalData: { 
        updatedBy: session.user.id, 
        departmentId: edb.departmentId,
        creatorId: edb.creatorId
      }
    });

    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Erreur lors de l\'approbation finale de l\'EDB:', error);
    return NextResponse.json({ message: 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.' }, { status: 500 });
  }
}