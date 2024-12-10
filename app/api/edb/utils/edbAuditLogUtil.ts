// edb/utils/edbAuditLogUtil.ts
import { PrismaClient, EDBEventType, EtatDeBesoin, Prisma, EDBStatus, AttachmentType, NotificationType, Access, StockEtatDeBesoin } from '@prisma/client';
import { sendNotification, NotificationPayload } from '@/app/actions/sendNotification';
import {  getNotificationTypeFromStatus, determineRecipients, getEventTypeFromStatus } from '@/app/api/utils/notificationsUtil';
import { generateNotificationMessage } from '@/app/api/utils/notificationMessage';
import generateEDBId from './edb-id-generator';

const prisma = new PrismaClient();

async function getUserName(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });
  return user?.name || 'Utilisateur inconnu';
}

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
  }
}

export async function sendEDBNotification(
  edb: EtatDeBesoin,
  action: EDBEventType,
  userId: number,
  additionalData?: Record<string, any>
): Promise<void> {
  const recipients = await determineRecipients(edb, edb.status, userId, 'STOCK');
  const userName = await getUserName(userId);
  const { subject, body } = generateNotificationMessage({
    id: edb.edbId,
    status: edb.status,
    actionInitiator: userName,
    entityType: 'STOCK'
  });

  const notificationPayload: NotificationPayload = {
    entityId: edb.edbId,
    entityType: 'STOCK',
    newStatus: edb.status,
    actorId: userId,
    actionInitiator: userName,
    additionalData: { 
      updatedBy: userId, 
      departmentId: edb.departmentId,
      ...additionalData
    }
  };

  await sendNotification(notificationPayload);
}

export async function updateEDBStatus(
  id: number,
  edbId: string,
  newStatus: EDBStatus,
  userId: number
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: id },
    data: { status: newStatus, updatedAt: new Date() },
    include: { department: true }
  });

  await logEDBEvent(
    id,
    userId,
    getEventTypeFromStatus(newStatus),
    { oldStatus: updatedEDB.status, newStatus }
  );

  await sendEDBNotification(updatedEDB, EDBEventType.UPDATED, userId);

  return updatedEDB;
}

export async function deleteEDB(edbId: number, userId: number): Promise<void> {
  const edb = await prisma.etatDeBesoin.findUnique({
    where: { id: edbId },
    include: {
      category: true,
      auditLogs: true,
      notifications: {
        include: {
          recipients: true
        }
      },
      attachments: true,
      finalSupplier: true
    }
  });

  if (!edb) {
    throw new Error('EDB introuvable');
  }

  // Start transaction to ensure all related records are deleted
  await prisma.$transaction(async (tx) => {
    // Delete all notification recipients
    if (edb.notifications.length > 0) {
      await tx.notificationRecipient.deleteMany({
        where: {
          notificationId: {
            in: edb.notifications.map(n => n.id)
          }
        }
      });
    }

    // Delete notifications
    await tx.notification.deleteMany({
      where: { etatDeBesoinId: edbId }
    });

    // Delete audit logs
    await tx.etatDeBesoinAuditLog.deleteMany({
      where: { etatDeBesoinId: edbId }
    });

    // Delete attachments
    await tx.attachment.deleteMany({
      where: { edbId }
    });

    // Delete final supplier if exists
    if (edb.finalSupplier) {
      await tx.finalSupplier.delete({
        where: { edbId }
      });
    }

    // Delete orders
    await tx.order.deleteMany({
      where: { etatDeBesoinId: edbId }
    });

    // Finally delete the EDB
    await tx.etatDeBesoin.delete({
      where: { id: edbId }
    });
  });
}

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

  const updatedEDB = await prisma.etatDeBesoin.findUnique({
    where: { id: edbId },
    include: { department: true }
  });

  if (updatedEDB) {
    await sendEDBNotification(updatedEDB, EDBEventType.ATTACHMENT_REMOVED, userId);
  }
}

export async function validateEDB(edbId: number, userId: number, userRole: string, userName: string): Promise<any> {
  const edb = await prisma.etatDeBesoin.findUnique({
    where: { id: edbId },
    include: { department: true, category: true },
  });

  if (!edb) {
    throw new Error('EDB introuvable');
  }

  let newStatus: EDBStatus;
  let notificationType: NotificationType;
  let action: EDBEventType;

  switch (userRole) {
    case 'RESPONSABLE':
    case 'RH':
      if (edb.status === 'SUBMITTED') {
        newStatus = 'APPROVED_RESPONSABLE';
        notificationType = NotificationType.EDB_APPROVED_SUPERIOR;
        action = EDBEventType.APPROVED_RESPONSABLE;
      } else {
        throw new Error('Non autorisé à approuver à cette étape');
      }
      break;
    case 'DOG':
    case 'DAF':
    case 'DRH':
    case 'DCM':
    case 'ADMIN':
    case 'DIRECTEUR':
      if (edb.status === 'SUBMITTED' || edb.status === 'APPROVED_RESPONSABLE') {
        newStatus = 'APPROVED_DIRECTEUR';
        notificationType = NotificationType.EDB_APPROVED_DIRECTOR;
        action = EDBEventType.APPROVED_DIRECTEUR;
      } else {
        throw new Error('Non autorisé à approuver à cette étape');
      }
      break;
    case 'IT_ADMIN':
      if (edb.status === 'AWAITING_IT_APPROVAL' && 
          (edb.category.name === 'Logiciels et licences' || edb.category.name === 'Matériel informatique')) {
        newStatus = 'IT_APPROVED';
        notificationType = NotificationType.EDB_APPROVED_DIRECTOR;
        action = EDBEventType.IT_APPROVED;
      } else {
        throw new Error('Non autorisé à approuver à cette étape');
      }
      break;
    case 'DIRECTEUR_GENERAL':
      if (edb.status !== 'DRAFT' && edb.status !== 'REJECTED') {
        newStatus = 'APPROVED_DG';
        notificationType = NotificationType.EDB_APPROVED_DG;
        action = EDBEventType.APPROVED_DG;
      } else {
        throw new Error('Validation impossible à cette étape');
      }
      break;
    default:
      throw new Error('Action non autorisée');
  }

  const updatedEdb = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { status: newStatus },
  });

  await logEDBEvent(
    edbId,
    userId,
    action,
    { oldStatus: edb.status, newStatus }
  );


  const recipients = await determineRecipients(updatedEdb, newStatus, userId, 'EDB');

  const notificationPayload: NotificationPayload = {
    entityId: edb.edbId,
    entityType: 'EDB',
    newStatus: newStatus,
    actorId: userId,
    actionInitiator: userName,
    additionalData: { 
      updatedBy: userId, 
      departmentId: edb.departmentId,
      creatorId: edb.creatorId
    }
  };

  await sendNotification(notificationPayload);

  return updatedEdb;
}

export async function escalateEDB(
  edbId: number,
  userId: number,
  reason: string
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { isEscalated: true, status: EDBStatus.ESCALATED },
    include: { department: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.ESCALATED,
    { reason }
  );

  await sendEDBNotification(updatedEDB, EDBEventType.ESCALATED, userId, { reason });

  return updatedEDB;
}

export async function chooseFinalSupplier(
  edbId: number,
  userId: number,
  supplierData: { filePath: string; supplierName: string; amount: number }
): Promise<EtatDeBesoin> {
  await prisma.finalSupplier.create({
    data: {
      ...supplierData,
      edbId,
      chosenBy: userId,
    },
  });

  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { status: 'SUPPLIER_CHOSEN' },
    include: { department: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.SUPPLIER_CHOSEN,
    { action: 'SUPPLIER_CHOSEN', supplierName: supplierData.supplierName }
  );

  await sendEDBNotification(updatedEDB, EDBEventType.SUPPLIER_CHOSEN, userId);

  return updatedEDB;
}

export async function createEDB(
  userId: number,
  edbData: {
    // title: string;
    category: number;
    reference: string;
    items: any[];
  }
): Promise<any> { // Consider creating a specific return type
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    throw new Error('User or employee not found');
  }

  const edbId = generateEDBId();

  // Determine initial status based on the user's role
  let initialStatus: EDBStatus = 'SUBMITTED';
  if (user.role === 'RESPONSABLE') {
    initialStatus = 'APPROVED_RESPONSABLE';
  } else if (user.role === 'DIRECTEUR') {
    initialStatus = 'APPROVED_DIRECTEUR';
  }else if (user.role === 'DAF' || 'DOG' || 'DCM' || 'DRH') {
    initialStatus = 'APPROVED_DIRECTEUR';
  } else if (user.role === 'DIRECTEUR_GENERAL') {
    initialStatus = 'APPROVED_DG';
  }

  const newEDB = await prisma.etatDeBesoin.create({
    data: {
      edbId,
      // title: edbData.title,
      description: { items: edbData.items },
      references: edbData.reference,
      status: initialStatus,
      department: { connect: { id: user.employee.currentDepartmentId } },
      creator: { connect: { id: user.employee.id } },
      userCreator: { connect: { id: user.id } },
      category: { connect: { id: edbData.category } },
    },
    include: { department: true }
  });

  // Log the EDB creation event
  await logEDBEvent(newEDB.id, userId, EDBEventType.SUBMITTED);

  // If the initial status is not SUBMITTED, log a separate validation event
  if (initialStatus !== 'SUBMITTED') {
    let validationEventType: EDBEventType;
    switch (initialStatus) {
      case 'APPROVED_RESPONSABLE':
        validationEventType = EDBEventType.APPROVED_RESPONSABLE;
        break;
      case 'APPROVED_DIRECTEUR':
        validationEventType = EDBEventType.APPROVED_DIRECTEUR;
        break;
      case 'APPROVED_DG':
        validationEventType = EDBEventType.APPROVED_DG;
        break;
      default:
        validationEventType = EDBEventType.UPDATED;
    }
    await logEDBEvent(newEDB.id, userId, validationEventType);
  }

  return newEDB;
}

export async function createEDBForUser(
  loggedInUserId: number,
  targetUserId: number,
  edbData: {
    category: number;
    reference?: string;
    items: Array<{ designation: string; quantity: number }>;
    existingEdbId?: string; // Make edbId optional
  }
): Promise<EtatDeBesoin> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { employee: true },
  });

  if (!targetUser || !targetUser.employee) {
    throw new Error('Impossible de trouver l\'employé');
  }

  // Use provided edbId or generate new one
  const edbId = edbData.existingEdbId || generateEDBId();

  // Determine initial status based on the target user's role
  let initialStatus: EDBStatus = 'SUBMITTED';
  if (targetUser.role === 'RESPONSABLE' ) {
    initialStatus = 'APPROVED_RESPONSABLE';
  } else if (targetUser.role === 'DIRECTEUR' || (targetUser.access && targetUser.access.includes('APPROVE_EDB' as Access))) {
    initialStatus = 'APPROVED_DIRECTEUR';
  } else if (targetUser.role === 'DIRECTEUR_GENERAL') {
    initialStatus = 'APPROVED_DG';
  }

  const newEDB = await prisma.etatDeBesoin.create({
    data: {
      edbId,
      description: { items: edbData.items },
      references: edbData.reference,
      status: initialStatus,
      department: { connect: { id: targetUser.employee.currentDepartmentId } },
      creator: { connect: { id: targetUser.employee.id } },
      userCreator: { connect: { id: targetUser.id } },
      category: { connect: { id: edbData.category } },
    },
    include: { department: true }
  });

  // Log the EDB creation event
  await logEDBEvent(newEDB.id, targetUserId, EDBEventType.SUBMITTED);

  // If the initial status is not SUBMITTED, log a separate validation event
  if (initialStatus !== 'SUBMITTED') {
    let validationEventType: EDBEventType;
    switch (initialStatus) {
      case 'APPROVED_RESPONSABLE':
        validationEventType = EDBEventType.APPROVED_RESPONSABLE;
        break;
      case 'APPROVED_DIRECTEUR':
        validationEventType = EDBEventType.APPROVED_DIRECTEUR;
        break;
      case 'APPROVED_DG':
        validationEventType = EDBEventType.APPROVED_DG;
        break;
      default:
        validationEventType = EDBEventType.UPDATED;
    }
    await logEDBEvent(newEDB.id, targetUserId, validationEventType);
  }


  await sendEDBNotification(newEDB, EDBEventType.SUBMITTED, loggedInUserId, {
    createdFor: targetUser.name,
    createdBy: loggedInUserId
  });

  return newEDB;
}

export async function addAttachmentToEDB(
  edbId: number,
  userId: number,
  attachmentData: {
    filePath: string;
    fileName: string;
    supplierName: string;
    totalAmount: number;
    type: AttachmentType;
  }
): Promise<EtatDeBesoin> {
  const createdAttachment = await prisma.attachment.create({
    data: {
      ...attachmentData,
      edbId,
      uploadedBy: userId,
    },
  });

  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { status: 'MAGASINIER_ATTACHED' },
    include: { department: true }
  });

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

  await sendEDBNotification(updatedEDB, 'ATTACHMENT_ADDED', userId);

  return updatedEDB;
}

export async function approveEDBByIT(
  edbId: number,
  userId: number
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'IT_APPROVED',
      itApprovedAt: new Date(),
      itApprovedBy: userId
    },
    include: { department: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.UPDATED,
    { action: 'IT_APPROVED' }
  );

  await sendEDBNotification(updatedEDB, EDBEventType.IT_APPROVED, userId);

  return updatedEDB;
}

export async function finalApproveEDB(
  edbId: number,
  userId: number
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'FINAL_APPROVAL',
      finalApprovedAt: new Date(),
      finalApprovedBy: userId
    },
    include: { department: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.FINAL_APPROVAL,
    { action: 'FINAL_APPROVAL' }
  );

  await sendEDBNotification(updatedEDB, 'FINAL_APPROVAL', userId);

  return updatedEDB;
}

export async function rejectEDB(
  edbId: number,
  userId: number,
  reason?: string
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'REJECTED',
      rejectionReason: reason
    },
    include: { department: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.REJECTED,
    { reason }
  );

  await sendEDBNotification(updatedEDB, EDBEventType.REJECTED, userId, { reason });

  return updatedEDB;
}

export async function markEDBAsDelivered(
  edbId: number,
  userId: number
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'DELIVERED',
    },
    include: { department: true, category: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.DELIVERED,
    { action: 'MARKED_AS_DELIVERED' }
  );

  // Determine recipients
  const creator = await prisma.user.findUnique({
    where: { id:updatedEDB.userCreatorId },
    include: { employee: true }
  });

  const director = await prisma.user.findFirst({
    where: { 
      role: 'DIRECTEUR',
      employee: { currentDepartmentId: updatedEDB.departmentId }
    }
  });

  let recipients = [creator?.id, director?.id].filter(Boolean) as number[];

  if (updatedEDB.category.name === 'Informatique') {
    const adminAndITAdmins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'IT_ADMIN'] }
      },
      select: { id: true }
    });
    recipients = [...recipients, ...adminAndITAdmins.map(user => user.id)];
  }

  const notificationPayload: NotificationPayload = {
    entityId: updatedEDB.edbId,
    entityType: 'EDB',
    newStatus: 'DELIVERED',
    actorId: userId,
    actionInitiator: (await getUserName(userId)),
    additionalData: { 
      updatedBy: userId, 
      departmentId: updatedEDB.departmentId,
      categoryId: updatedEDB.categoryId
    },
  };

  await sendNotification(notificationPayload);

  return updatedEDB;
}

export async function markEDBAsCompleted(
  edbId: number,
  userId: number
): Promise<EtatDeBesoin> {
  const updatedEDB = await prisma.etatDeBesoin.update({
    where: { id: edbId },
    data: { 
      status: 'COMPLETED',
    },
    include: { department: true }
  });

  await logEDBEvent(
    edbId,
    userId,
    EDBEventType.COMPLETED,
    { action: 'MARKED_AS_COMPLETED' }
  );

  await sendEDBNotification(updatedEDB, EDBEventType.COMPLETED, userId);

  return updatedEDB;
}