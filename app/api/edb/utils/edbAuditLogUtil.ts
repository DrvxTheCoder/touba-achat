import { PrismaClient, EDBEventType, EtatDeBesoin, User, Prisma, EDBStatus, AttachmentType, NotificationType, Role } from '@prisma/client';
import { sendNotification, NotificationPayload } from '@/app/actions/sendNotification';
import { getEventTypeFromStatus, getNotificationTypeFromStatus, determineRecipients } from '@/app/api/utils/notificationsUtil';

const prisma = new PrismaClient();

export async function logEDBEvent(
  edbId: number,
  userId: number,
  eventType: EDBEventType,
  details?: Record<string, any>
): Promise<void> {
  try {
    await prisma.etatDeBesoinAuditLog.create({
      data: {
        etatDeBesoinId: edbId,
        userId: userId,
        eventType: eventType,
        details: details ? details as Prisma.JsonObject : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log EDB event:', error);
    // You might want to handle this error more gracefully in a production environment
  }
}

// Example usage for status change
export async function updateEDBStatus(
  id: number,
  edbId: string,
  newStatus: EDBStatus,
  userId: number
): Promise<void> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: id },
    data: { status: newStatus, updatedAt: new Date() },
  });

  await logEDBEvent(
    id,
    userId,
    getEventTypeFromStatus(newStatus),
    { oldStatus: updatedEDB.status, newStatus }
  );

  const recipients = await determineRecipients(updatedEDB, newStatus, userId);

  const notificationPayload: NotificationPayload = {
    type: getNotificationTypeFromStatus(newStatus),
    message: `EDB #${edbId} a été mis à jour vers ${newStatus}`,
    entityId: edbId,
    entityType: 'EDB',
    recipients,
    additionalData: { updatedBy: userId, departmentId: updatedEDB.departmentId }
  };

  await sendNotification(notificationPayload);
}

export async function addAttachmentToEDB(
  edbId: number,
  userId: number,
  attachmentData: {
    filePath: string;
    fileName?: string;
    supplierName: string;
    totalAmount: number;
    type: AttachmentType;
  }
): Promise<void> {
  try {
    console.log('Attachment data:', attachmentData);

    const resultEventType = EDBEventType.MAGASINIER_ATTACHED;

    const createdAttachment = await prisma.attachment.create({
      data: {
        ...attachmentData,
        fileName: attachmentData.fileName || 'Facture Pro Forma',
        edbId,
        uploadedBy: userId,
      },
    });

    console.log('Created attachment:', createdAttachment);

    // Update EDB status
    const updatedEDB = await prisma.etatDeBesoin.update({
      where: { id: edbId },
      data: { status: 'MAGASINIER_ATTACHED' },
    });

    // Log only one event
    await logEDBEvent(
      edbId,
      userId,
      EDBEventType.MAGASINIER_ATTACHED,
      { 
        fileName: createdAttachment.fileName, 
        attachmentType: attachmentData.type,
        newStatus: 'MAGASINIER_ATTACHED'
      }
    );

    const recipients = await determineRecipients(updatedEDB, resultEventType, userId);

    const notificationPayload: NotificationPayload = {
      type: getNotificationTypeFromStatus(resultEventType),
      message: `Facture rattaché à l'EDB #${edbId} a par le Service d'Achat`,
      entityId: edbId,
      entityType: 'EDB',
      recipients,
      additionalData: { updatedBy: userId, departmentId: updatedEDB.departmentId }
    };
  
    await sendNotification(notificationPayload);
    
  } catch (error) {
    console.error('Error adding attachment to EDB:', error);
    throw error;
  }
}

// New function for removing attachments
export async function removeAttachmentFromEDB(
  edbId: number,
  userId: number,
  attachmentId: number
): Promise<void> {
  const removedAttachment = await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.ATTACHMENT_REMOVED,
    { fileName: removedAttachment.fileName, attachmentType: removedAttachment.type }
  );
}

// New function for escalating an EDB
export async function escalateEDB(
  edbId: number,
  userId: number,
  reason: string
): Promise<void> {
  await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { isEscalated: true },
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.ESCALATED,
    { reason }
  );
}

// New function for supplier choice
export async function chooseFinalSupplier(
  edbId: number,
  userId: number,
  supplierData: { filePath: string; supplierName: string; amount: number }
): Promise<void> {
  await prisma.finalSupplier.create({
    data: {
      ...supplierData,
      edbId,
      chosenBy: userId,
    },
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.SUPPLIER_CHOSEN,
    { action: 'SUPPLIER_CHOSEN', supplierName: supplierData.supplierName }
  );
}

// New function for IT approval
export async function approveEDBByIT(
  edbId: number,
  userId: number
): Promise<void> {
  await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'IT_APPROVED',
      itApprovedAt: new Date(),
      itApprovedBy: userId
    },
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.UPDATED,
    { action: 'IT_APPROVED' }
  );
}

// New function for final approval
export async function finalApproveEDB(
  edbId: number,
  userId: number
): Promise<void> {
  await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'APPROVED_DG',
      finalApprovedAt: new Date(),
      finalApprovedBy: userId
    },
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.APPROVED_DG,
    { action: 'FINAL_APPROVAL' }
  );
}