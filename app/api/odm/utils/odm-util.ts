// odm/utils/odm-util.ts
import { PrismaClient, ODMEventType, OrdreDeMission, Prisma, ODMStatus, NotificationType } from '@prisma/client';
import { sendNotification, NotificationPayload } from '@/app/actions/sendNotification';
import {  getODMEventTypeFromStatus, getNotificationTypeFromStatus, determineRecipients } from '@/app/api/utils/notificationsUtil';
import { generateNotificationMessage } from '@/app/api/utils/notificationMessage';
import generateODMId from './odm-id-generator';

const prisma = new PrismaClient();

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

async function sendODMNotification(
  odm: OrdreDeMission,
  action: ODMEventType,
  userId: number,
  additionalData?: Record<string, any>
): Promise<void> {
  const recipients = await determineRecipients(odm, odm.status, userId, 'ODM');
  const userName = await getUserName(userId);

  const { subject, body } = generateNotificationMessage({
    id: odm.odmId,
    status: odm.status,
    actionInitiator: userName,
    entityType: 'ODM'
  });

  const notificationPayload: NotificationPayload = {
    entityId: odm.odmId,
    entityType: 'ODM',
    newStatus: odm.status,
    actorId: userId,
    actionInitiator: userName,
    additionalData: { 
      updatedBy: userId, 
      departmentId: odm.departmentId,
      ...additionalData
    }
  };


  await sendNotification(notificationPayload);
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

  // Determine initial status based on the user's role
  let initialStatus: ODMStatus = 'SUBMITTED';
  if (user.role === 'DIRECTEUR' || user.role === 'DIRECTEUR_GENERAL') {
    initialStatus = 'AWAITING_RH_PROCESSING';
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

  // Send notification
  await sendODMNotification(newODM, ODMEventType.SUBMITTED, userId);

  return newODM;
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
    getODMEventTypeFromStatus(newStatus),
    { oldStatus: updatedODM.status, newStatus }
  );

  await sendODMNotification(updatedODM, ODMEventType.UPDATED, userId);

  return updatedODM;
}

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

  if (userRole === 'DIRECTEUR' && odm.status === 'SUBMITTED') {
    newStatus = 'AWAITING_RH_PROCESSING';
    eventType = ODMEventType.AWAITING_RH_PROCESSING;
  } 
  // else if (userRole === 'RH' && odm.status === 'AWAITING_RH_PROCESSING') {
  //   newStatus = 'COMPLETED';
  //   eventType = ODMEventType.COMPLETED;
  // }
  else if (userRole === 'DIRECTEUR_GENERAL' && odm.status === 'SUBMITTED'){
    newStatus = 'AWAITING_RH_PROCESSING';
    eventType = ODMEventType.AWAITING_RH_PROCESSING;
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

  await sendODMNotification(updatedODM, eventType, userId);

  return updatedODM;
}

export async function approveODMByRHDirector(
  odmId: number,
  userId: number
): Promise<OrdreDeMission> {
  const odm = await prisma.ordreDeMission.findUnique({
    where: { id: odmId },
    include: { department: true },
  });

  if (!odm) {
    throw new Error('ODM introuvable');
  }

  if (odm.status !== 'AWAITING_RH_PROCESSING') {
    throw new Error('ODM non éligible pour approbation par le Directeur RH');
  }

  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: { 
      status: 'RH_PROCESSING',
      approverId: userId
    },
    include: { department: true }
  });

  await logODMEvent(odmId, userId, ODMEventType.RH_PROCESSING, { oldStatus: odm.status, newStatus: 'RH_PROCESSING' });

  await sendODMNotification(updatedODM, ODMEventType.RH_PROCESSING, userId);

  return updatedODM;
}

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

  await sendODMNotification(updatedODM, ODMEventType.REJECTED, userId, { reason });

  return updatedODM;
}

export async function processODMByRH(
  odmId: number,
  userId: number,
  processingData: {
    expenseItems: { type: string; amount: number; description?: string }[];
    totalCost: number;
  }
): Promise<OrdreDeMission> {
  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: { 
      status: 'COMPLETED',
      totalCost: processingData.totalCost,
      rhProcessorId: userId,
      expenseItems: processingData.expenseItems as any // Prisma will handle JSON conversion
    },
    include: { department: true }
  });

  await logODMEvent(
    odmId,
    userId,
    ODMEventType.COMPLETED,
    { totalCost: processingData.totalCost }
  );

  await sendODMNotification(updatedODM, ODMEventType.COMPLETED, userId);

  return updatedODM;
}

export async function editODMProcessing(
  odmId: number,
  userId: number,
  processingData: {
    expenseItems: { type: string; amount: number; description?: string }[];
    totalCost: number;
  }
): Promise<OrdreDeMission> {
  const updatedODM = await prisma.ordreDeMission.update({
    where: { id: odmId },
    data: { 
      totalCost: processingData.totalCost,
      expenseItems: processingData.expenseItems as any // Prisma will handle JSON conversion
    },
    include: { department: true }
  });

  await logODMEvent(
    odmId,
    userId,
    ODMEventType.UPDATED,
    { totalCost: processingData.totalCost }
  );

  return updatedODM;
}