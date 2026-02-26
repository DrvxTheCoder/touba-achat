// odm/utils/odm-util.ts
import { PrismaClient, ODMEventType, OrdreDeMission, Prisma, ODMStatus, NotificationType, Access } from '@prisma/client';
// import { sendNotification, NotificationPayload } from '@/app/actions/sendNotification';
// import { getODMEventTypeFromStatus, getNotificationTypeFromStatus, determineRecipients } from '@/app/api/utils/notificationsUtil';
// import { generateNotificationMessage } from '@/app/api/utils/notificationMessage';
import generateODMId from './odm-id-generator';
import { AccompanyingPerson } from '@/app/dashboard/odm/utils/odm';

const prisma = new PrismaClient();

interface ProcessingData {
  missionCostPerDay: number;
  expenseItems: { type: string; amount: number; description?: string }[];
  totalCost: number;
  accompanyingPersons: AccompanyingPerson[];
}

async function getUserName(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });
  return user?.name || 'Utilisateur inconnu';
}

async function logODMEvent(
  odmId: number,
  userId: number,
  eventType: ODMEventType,
  details?: Record<string, any>
): Promise<void> {
  try {
    await prisma.ordreDeMissionAuditLog.create({
      data: {
        ordreDeMissionId: odmId,
        userId: userId,
        eventType: eventType,
        details: details ? details as Prisma.JsonObject : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log ODM event:', error);
  }
}

// NOTE: Email notifications are temporarily disabled for ODM workflow revamp
// Will be re-enabled after notification system is updated
// async function sendODMNotification(
//   odm: OrdreDeMission,
//   action: ODMEventType,
//   userId: number,
//   additionalData?: Record<string, any>
// ): Promise<void> {
//   const recipients = await determineRecipients(odm, odm.status, userId, 'ODM');
//   const userName = await getUserName(userId);

//   const { subject, body } = generateNotificationMessage({
//     id: odm.odmId,
//     status: odm.status,
//     actionInitiator: userName,
//     entityType: 'ODM'
//   });

//   const notificationPayload: NotificationPayload = {
//     entityId: odm.odmId,
//     entityType: 'ODM',
//     newStatus: odm.status,
//     actorId: userId,
//     actionInitiator: userName,
//     additionalData: {
//       updatedBy: userId,
//       departmentId: odm.departmentId,
//       ...additionalData
//     }
//   };

//   await sendNotification(notificationPayload);
// }

/**
 * Helper to check if user has specific ODM access
 */
async function hasODMAccess(userId: number, requiredAccess: Access): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { access: true }
  });
  return user?.access.includes(requiredAccess) ?? false;
}

/**
 * Check if user can approve at director level
 * Either has ODM_DIRECTOR_APPROVE access or is a DIRECTEUR role
 */
async function canApproveAsDirector(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, access: true }
  });
  if (!user) return false;

  return user.access.includes('ODM_DIRECTOR_APPROVE' as Access) ||
    ['DIRECTEUR', 'DAF', 'DRH', 'DOG', 'DCM', 'DIRECTEUR_GENERAL', 'ADMIN'].includes(user.role);
}

/**
 * Check if user can perform DRH actions
 * Either has ODM_DRH_APPROVE access or is DRH role
 */
async function canApproveAsDRH(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, access: true }
  });
  if (!user) return false;

  return user.access.includes('ODM_DRH_APPROVE' as Access) || user.role === 'DRH' || user.role === 'ADMIN';
}

/**
 * Check if user can process ODM (RH processing)
 * Either has ODM_RH_PROCESS access or is RH role
 */
async function canProcessAsRH(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, access: true }
  });
  if (!user) return false;

  return user.access.includes('ODM_RH_PROCESS' as Access) || user.role === 'RH' || user.role === 'DRH' || user.role === 'ADMIN';
}

/**
 * Check if user can give DOG final approval
 * Either has ODM_DOG_APPROVE access or is DOG role
 */
async function canApproveAsDOG(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, access: true }
  });
  if (!user) return false;

  return user.access.includes('ODM_DOG_APPROVE' as Access) || user.role === 'DOG' || user.role === 'ADMIN';
}

/**
 * Check if user can print ODMs
 * Either has ODM_PRINT access or is RH role
 */
async function canPrintODM(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, access: true }
  });
  if (!user) return false;

  return user.access.includes('ODM_PRINT' as Access) || user.role === 'RH' || user.role === 'DRH' || user.role === 'ADMIN';
}

export async function createODM(
  userId: number,
  odmData: {
    title: string;
    missionType: string;
    startDate: Date;
    endDate: Date;
    location: string;
    description: string;
    vehicule?: string;
    hasAccompanying: boolean;
    accompanyingPersons?: { name: string; role: string }[];
  }
): Promise<OrdreDeMission> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    throw new Error('User or employee not found');
  }

  const odmId = generateODMId();

  // Determine initial status based on the user's role/access
  // Directors and above bypass initial director approval
  let initialStatus: ODMStatus = 'SUBMITTED';
  const canBypassDirector = await canApproveAsDirector(userId);
  if (canBypassDirector) {
    initialStatus = 'AWAITING_DRH_APPROVAL';
  }

  const newODM = await prisma.ordreDeMission.create({
    data: {
      odmId,
      ...odmData,
      status: initialStatus,
      department: { connect: { id: user.employee.currentDepartmentId } },
      creator: { connect: { id: user.employee.id } },
      userCreator: { connect: { id: user.id } },
    },
    include: { department: true }
  });

  // Log the ODM creation event
  await logODMEvent(newODM.id, userId, ODMEventType.SUBMITTED);

  // Email notifications disabled
  // await sendODMNotification(newODM, ODMEventType.SUBMITTED, userId);

  return newODM;
}

export async function deleteODM(odmId: number, userId: number): Promise<void> {
  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: {
      notifications: {
        include: {
          recipients: true
        }
      },
      auditLogs: true
    }
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  // Start transaction to ensure all related records are deleted
  await prisma.$transaction(async (tx) => {
    // Delete all notification recipients
    if (odm.notifications.length > 0) {
      await tx.notificationRecipient.deleteMany({
        where: {
          notificationId: {
            in: odm.notifications.map(n => n.id)
          }
        }
      });
    }

    // Delete notifications
    await tx.notification.deleteMany({
      where: { ordreDeMissionId: odmId }
    });

    // Delete audit logs
    await tx.ordreDeMissionAuditLog.deleteMany({
      where: { ordreDeMissionId: odmId }
    });

    // Finally delete the ODM
    await tx.ordreDeMission.delete({
      where: { id: odmId }
    });
  });
}

export async function updateODMStatus(
  id: number,
  odmId: string,
  newStatus: ODMStatus,
  userId: number
): Promise<OrdreDeMission> {
  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: id },
    data: { status: newStatus, updatedAt: new Date() },
    include: { department: true }
  });

  await logODMEvent(
    id,
    userId,
    ODMEventType.UPDATED,
    { oldStatus: updatedODM.status, newStatus }
  );

  // Email notifications disabled
  // await sendODMNotification(updatedODM, ODMEventType.UPDATED, userId);

  return updatedODM;
}

/**
 * Director approves ODM (SUBMITTED -> AWAITING_DRH_APPROVAL)
 */
export async function approveODMByDirector(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canApprove = await canApproveAsDirector(userId);
  if (!canApprove) {
    throw new Error('Non autorisé à approuver comme directeur');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'SUBMITTED') {
    throw new Error('ODM non éligible pour approbation directeur');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'AWAITING_DRH_APPROVAL',
      approverId: userId
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.AWAITING_DRH_APPROVAL, {
    oldStatus: odm.status,
    newStatus: 'AWAITING_DRH_APPROVAL'
  });

  // Email notifications disabled
  // await sendODMNotification(updatedODM, ODMEventType.AWAITING_DRH_APPROVAL, userId);

  return updatedODM;
}

/**
 * DRH marks ODM for RH processing (AWAITING_DRH_APPROVAL -> RH_PROCESSING)
 */
export async function approveDRHForProcessing(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canApprove = await canApproveAsDRH(userId);
  if (!canApprove) {
    throw new Error('Non autorisé - Seul le DRH peut effectuer cette action');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'AWAITING_DRH_APPROVAL') {
    throw new Error('ODM non éligible pour envoi au traitement RH');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'RH_PROCESSING',
      approverId: userId
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.RH_PROCESSING, {
    oldStatus: odm.status,
    newStatus: 'RH_PROCESSING'
  });

  return updatedODM;
}

/**
 * RH processes ODM and submits for DRH validation (RH_PROCESSING -> AWAITING_DRH_VALIDATION)
 */
export async function processODMByRH(
  odmId: number,
  userId: number,
  processingData: ProcessingData
): Promise<OrdreDeMission> {
  const canProcess = await canProcessAsRH(userId);
  if (!canProcess) {
    throw new Error('Non autorisé - Seul RH peut traiter les ODMs');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'RH_PROCESSING') {
    throw new Error('ODM non éligible pour traitement RH');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'AWAITING_DRH_VALIDATION',
      totalCost: processingData.totalCost,
      rhProcessorId: userId,
      accompanyingPersons: processingData.accompanyingPersons as any,
      missionCostPerDay: processingData.missionCostPerDay,
      expenseItems: processingData.expenseItems
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.AWAITING_DRH_VALIDATION, {
    totalCost: processingData.totalCost,
    accompanyingPersons: processingData.accompanyingPersons
  });

  return updatedODM;
}

/**
 * DRH validates RH work and sends to DOG (AWAITING_DRH_VALIDATION -> AWAITING_DOG_APPROVAL)
 */
export async function validateByDRH(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canValidate = await canApproveAsDRH(userId);
  if (!canValidate) {
    throw new Error('Non autorisé - Seul le DRH peut valider');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'AWAITING_DRH_VALIDATION') {
    throw new Error('ODM non éligible pour validation DRH');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'AWAITING_DOG_APPROVAL',
      approverId: userId
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.AWAITING_DOG_APPROVAL, {
    oldStatus: odm.status,
    newStatus: 'AWAITING_DOG_APPROVAL'
  });

  return updatedODM;
}

/**
 * DOG gives final approval (AWAITING_DOG_APPROVAL -> READY_FOR_PRINT)
 */
export async function approveByDOG(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canApprove = await canApproveAsDOG(userId);
  if (!canApprove) {
    throw new Error('Non autorisé - Seul le DOG peut donner l\'approbation finale');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'AWAITING_DOG_APPROVAL') {
    throw new Error('ODM non éligible pour approbation DOG');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'READY_FOR_PRINT',
      updatedAt: new Date()
    },
    include: {
      department: true,
      auditLogs: true,
      creator: true,
      userCreator: true
    }
  });

  await logODMEvent(odmId, userId, ODMEventType.READY_FOR_PRINT, {
    oldStatus: odm.status,
    newStatus: 'READY_FOR_PRINT',
    totalAmount: odm.totalCost
  });

  return updatedODM;
}

/**
 * Reject ODM at any stage
 */
export async function rejectODM(
  odmId: number,
  userId: number,
  reason: string
): Promise<OrdreDeMission> {
  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason
    },
    include: { department: true }
  });

  await logODMEvent(
    odmId,
    userId,
    ODMEventType.REJECTED,
    { reason }
  );

  // Email notifications disabled
  // await sendODMNotification(updatedODM, ODMEventType.REJECTED, userId, { reason });

  return updatedODM;
}

/**
 * DRH restarts a rejected ODM back to RH_PROCESSING
 */
export async function restartODMToProcessing(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canRestart = await canApproveAsDRH(userId);
  if (!canRestart) {
    throw new Error('Non autorisé - Seul le DRH peut redémarrer les ODMs');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'REJECTED') {
    throw new Error('Seuls les ODMs rejetés peuvent être redémarrés');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'RH_PROCESSING',
      rejectionReason: null
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.RESTARTED, {
    oldStatus: odm.status,
    newStatus: 'RH_PROCESSING',
    action: 'RESTART_TO_PROCESSING'
  });

  return updatedODM;
}

/**
 * DRH restarts a rejected ODM back to AWAITING_DOG_APPROVAL
 */
export async function restartODMToDOGApproval(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canRestart = await canApproveAsDRH(userId);
  if (!canRestart) {
    throw new Error('Non autorisé - Seul le DRH peut redémarrer les ODMs');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'REJECTED') {
    throw new Error('Seuls les ODMs rejetés peuvent être redémarrés');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'AWAITING_DOG_APPROVAL',
      rejectionReason: null
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.RESTARTED, {
    oldStatus: odm.status,
    newStatus: 'AWAITING_DOG_APPROVAL',
    action: 'RESTART_TO_DOG_APPROVAL'
  });

  return updatedODM;
}

/**
 * Mark ODM as printed (READY_FOR_PRINT -> COMPLETED)
 * Called after the user closes the print document tab
 */
export async function printODM(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const canPrint = await canPrintODM(userId);
  if (!canPrint) {
    throw new Error('Non autorisé à imprimer les ODMs');
  }

  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'READY_FOR_PRINT') {
    throw new Error('Seuls les ODMs prêts pour impression peuvent être marqués comme imprimés');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: 'COMPLETED',
      updatedAt: new Date()
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.COMPLETED, {
    oldStatus: odm.status,
    newStatus: 'COMPLETED'
  });

  return updatedODM;
}

export async function editODMProcessing(
  odmId: number,
  userId: number,
  processingData: ProcessingData
): Promise<OrdreDeMission> {
  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      missionCostPerDay: processingData.missionCostPerDay,
      totalCost: processingData.totalCost,
      expenseItems: processingData.expenseItems,
      accompanyingPersons: processingData.accompanyingPersons as any
    },
    include: {
      department: true,
      auditLogs: true
    }
  });

  await logODMEvent(
    odmId,
    userId,
    ODMEventType.UPDATED,
    {
      totalCost: processingData.totalCost,
      accompanyingPersons: processingData.accompanyingPersons
    }
  );

  return updatedODM;
}

// ============================================
// LEGACY FUNCTIONS - Kept for backward compatibility
// These will be removed after full migration
// ============================================

/**
 * @deprecated Use approveODMByDirector instead
 */
export async function approveODM(
  odmId: number,
  userId: number,
  userRole: string
): Promise<OrdreDeMission> {
  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  let newStatus: ODMStatus;
  let eventType: ODMEventType;

  // Map old flow to new flow
  if (odm.status === 'SUBMITTED') {
    newStatus = 'AWAITING_DRH_APPROVAL';
    eventType = ODMEventType.AWAITING_DRH_APPROVAL;
  } else {
    throw new Error('Non autorisé à approuver à cette étape');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: {
      status: newStatus,
      approverId: userId
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, eventType, { oldStatus: odm.status, newStatus });

  return updatedODM;
}

/**
 * @deprecated Use approveDRHForProcessing instead
 */
export async function approveODMByRHDirector(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  return approveDRHForProcessing(odmId, userId);
}

/**
 * @deprecated Use approveByDOG instead
 */
export async function approveODMByFinance(
  odmId: number,
  userId: number,
): Promise<OrdreDeMission> {
  // Map old finance approval to new DOG approval
  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  // Handle legacy status
  if (odm.status === 'AWAITING_FINANCE_APPROVAL') {
    const updatedODM = await prisma.ordreDeMission.update({
      where: { id: odmId },
      data: {
        status: 'READY_FOR_PRINT',
        updatedAt: new Date()
      },
      include: {
        department: true,
        auditLogs: true,
        creator: true,
        userCreator: true
      }
    });

    await logODMEvent(odmId, userId, ODMEventType.READY_FOR_PRINT, {
      oldStatus: odm.status,
      newStatus: 'READY_FOR_PRINT',
      totalAmount: odm.totalCost
    });

    return updatedODM;
  }

  // New flow
  return approveByDOG(odmId, userId);
}

/**
 * @deprecated Use rejectODM instead
 */
export async function rejectODMByFinance(
  odmId: number,
  userId: number,
  reason: string
): Promise<OrdreDeMission> {
  return rejectODM(odmId, userId, reason);
}
