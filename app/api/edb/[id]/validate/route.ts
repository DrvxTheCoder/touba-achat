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
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { role } = session.user;

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { department: true, category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB not found' }, { status: 404 });
    }

    // Determine the new status based on the user's role and current EDB status
    let newStatus: EDBStatus;
    let notificationType: NotificationType;
    let action: EDBEventType;

    switch (role) {
      case 'RESPONSABLE':
        if (edb.status === 'SUBMITTED') {
          newStatus = 'APPROVED_RESPONSABLE';
          notificationType = NotificationType.EDB_APPROVED_SUPERIOR;
          action = EDBEventType.APPROVED_RESPONSABLE;
        } else {
          return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      case 'DIRECTEUR':
        if (edb.status === 'SUBMITTED' || edb.status === 'APPROVED_RESPONSABLE') {
          newStatus = 'APPROVED_DIRECTEUR';
          notificationType = NotificationType.EDB_APPROVED_DIRECTOR;
          action = EDBEventType.APPROVED_DIRECTEUR;
        } else {
          return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      case 'IT_ADMIN':
        if (edb.status === 'AWAITING_IT_APPROVAL' && 
            (edb.category.name === 'Logiciels et licences' || edb.category.name === 'Matériel informatique')) {
          newStatus = 'IT_APPROVED';
          notificationType = NotificationType.EDB_APPROVED_DIRECTOR; // Assuming we use the same type for IT approval
          action = EDBEventType.IT_APPROVED;
        } else {
          return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      case 'DIRECTEUR_GENERAL':
        if (edb.status !== 'DRAFT' && edb.status !== 'REJECTED') {
          newStatus = 'APPROVED_DG';
          notificationType = NotificationType.EDB_APPROVED_DG;
          action = EDBEventType.APPROVED_DG;
        } else {
          return NextResponse.json({ message: 'Validation impossible à cette étape' }, { status: 403 });
        }
        break;
      default:
        return NextResponse.json({ message: 'Action non autorisé' }, { status: 403 });
    }

    // Update the EDB status
    const updatedEdb = await prisma.etatDeBesoin.update({
      where: { id: Number(id) },
      data: { status: newStatus },
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
    console.error('Error validating EDB:', error);
    return NextResponse.json({ message: 'Une erreur inattendue s\'est produite. Veuillez ressayer plus tard.' }, { status: 500 });
  }
}