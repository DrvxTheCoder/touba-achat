import { PrismaClient, EDBEventType, EtatDeBesoin, User, Prisma, EDBStatus, AttachmentType } from '@prisma/client';

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

// Helper function to get the appropriate EDBEventType based on the new status
function getEventTypeFromStatus(status: EDBStatus): EDBEventType {
  switch (status) {
    case 'DRAFT': return EDBEventType.DRAFT_CREATED;
    case 'SUBMITTED': return EDBEventType.SUBMITTED;
    case 'APPROVED_RESPONSABLE': return EDBEventType.APPROVED_RESPONSABLE;
    case 'APPROVED_DIRECTEUR': return EDBEventType.APPROVED_DIRECTEUR;
    case 'AWAITING_MAGASINIER': return EDBEventType.UPDATED;
    case 'MAGASINIER_ATTACHED': return EDBEventType.UPDATED;
    case 'AWAITING_SUPPLIER_CHOICE': return EDBEventType.UPDATED;
    case 'SUPPLIER_CHOSEN': return EDBEventType.UPDATED;
    case 'AWAITING_IT_APPROVAL': return EDBEventType.UPDATED;
    case 'IT_APPROVED': return EDBEventType.UPDATED;
    case 'AWAITING_FINAL_APPROVAL': return EDBEventType.UPDATED;
    case 'APPROVED_DG': return EDBEventType.APPROVED_DG;
    case 'REJECTED': return EDBEventType.REJECTED;
    case 'COMPLETED': return EDBEventType.UPDATED;
    default: 
      console.warn(`Unhandled EDB status: ${status}`);
      return EDBEventType.UPDATED;
  }
}

// Example usage for status change
export async function updateEDBStatus(
  edbId: number,
  newStatus: EDBStatus,
  userId: number
): Promise<void> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { status: newStatus, updatedAt: new Date() },
  });

  await logEDBEvent(
    edbId,
    userId,
    getEventTypeFromStatus(newStatus),
    { oldStatus: updatedEDB.status, newStatus }
  );
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
    await prisma.etatDeBesoin.update({
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