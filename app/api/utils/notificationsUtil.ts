import { PrismaClient, EDBStatus, ODMStatus, NotificationType, Role, EDBEventType, ODMEventType, Access } from '@prisma/client';
import { generateNotificationMessage } from './notificationMessage';

const prisma = new PrismaClient();

export function getEventTypeFromStatus(status: EDBStatus): EDBEventType {
  switch (status) {
    case 'DRAFT': return EDBEventType.DRAFT_CREATED;
    case 'SUBMITTED': return EDBEventType.SUBMITTED;
    case 'ESCALATED': return EDBEventType.ESCALATED;
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

export function getODMEventTypeFromStatus(status: ODMStatus): ODMEventType {
  switch (status) {
    case 'SUBMITTED': return ODMEventType.SUBMITTED;
    case 'AWAITING_DIRECTOR_APPROVAL': return ODMEventType.UPDATED;
    case 'AWAITING_RH_PROCESSING': return ODMEventType.RH_PROCESSING;
    case 'RH_PROCESSING': return ODMEventType.UPDATED;
    case 'COMPLETED': return ODMEventType.COMPLETED;
    case 'REJECTED': return ODMEventType.REJECTED;
    default:
      console.warn(`Unhandled ODM status: ${status}`);
      return ODMEventType.UPDATED;
  }
}

export function getNotificationTypeFromStatus(status: EDBStatus | ODMStatus, entityType: 'EDB' | 'ODM'): NotificationType {
  if (entityType === 'EDB') {
    switch (status) {
      case 'SUBMITTED':
        return NotificationType.EDB_CREATED;
      case 'APPROVED_RESPONSABLE':
        return NotificationType.EDB_APPROVED_SUPERIOR;
      case 'APPROVED_DIRECTEUR':
        return NotificationType.EDB_APPROVED_DIRECTOR;
      case 'ESCALATED':
        return NotificationType.EDB_ESCALATED;
      case 'DELIVERED':
        return NotificationType.EDB_DELIVERED;
      case 'APPROVED_DG':
        return NotificationType.EDB_APPROVED_DG;
      case 'REJECTED':
        return NotificationType.EDB_REJECTED;
      default:
        return NotificationType.EDB_UPDATED;
    }
  } else {
    switch (status) {
      case 'SUBMITTED':
        return NotificationType.ODM_CREATED;
      case 'APPROVED_DIRECTEUR':
        return NotificationType.ODM_APPROVED_DIRECTOR;
      case 'AWAITING_RH_PROCESSING':
        return NotificationType.ODM_APPROVED_DIRECTOR;
      case 'AWAITING_FINANCE_APPROVAL':
        return NotificationType.ODM_AWAITING_FINANCE_APPROVAL;
      case 'COMPLETED':
        return NotificationType.ODM_COMPLETED;
      case 'REJECTED':
        return NotificationType.ODM_REJECTED;
      default:
        return NotificationType.ODM_UPDATED;
    }
  }
}

export async function determineRecipients(
  entity: any,
  newStatus: EDBStatus | ODMStatus,
  actorId: number,
  entityType: 'EDB' | 'ODM'
): Promise<number[]> {
  const recipients = new Set<number>();

  // Fetch all relevant users in one query
  const relevantUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: entity.creatorId },
        { id: actorId },
        { 
          employee: { 
            currentDepartmentId: entity.departmentId,
            OR: [
              { user: { role: 'RESPONSABLE' } },
              { user: { role: 'DIRECTEUR' } }
            ]
          }
        },
        { role: 'DIRECTEUR_GENERAL' },
        { role: 'MAGASINIER' },
        { role: 'IT_ADMIN' },
        { role: 'RH' },
        { access: { has: Access.CHOOSE_SUPPLIER } }
      ]
    },
    select: {
      id: true,
      role: true,
      access: true,
      employee: {
        select: {
          currentDepartmentId: true,
          currentDepartment: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // Always notify the creator and the actor
  recipients.add(entity.creatorId);
  // recipients.add(actorId);

  if (entityType === 'ODM' && newStatus === 'AWAITING_RH_PROCESSING') {
    // Separate query to find HR director
    const hrDirector = await prisma.user.findFirst({
      where: {
        role: 'DIRECTEUR',
        employee: {
          currentDepartment: {
            name: 'Direction Ressources Humaines'
          }
        }
      },
      select: {
        id: true
      }
    });

    if (hrDirector) {
      recipients.add(hrDirector.id);
    } else {
      console.warn('No HR Director found for ODM notification');
    }
  }
  const edbStatusesAfterDirecteurApproval = [
    'APPROVED_DIRECTEUR',
    'ESCALATED',
    'AWAITING_MAGASINIER',
    'MAGASINIER_ATTACHED',
    'AWAITING_SUPPLIER_CHOICE',
    'SUPPLIER_CHOSEN',
    'AWAITING_IT_APPROVAL',
    'IT_APPROVED',
    'AWAITING_FINAL_APPROVAL',
    'APPROVED_DG',
    'DELIVERED',
    'COMPLETED'
  ];

  relevantUsers.forEach(user => {
    if (entityType === 'EDB') {
      // Notify magasinier for all statuses after APPROVED_DIRECTEUR
      if (user.role === 'MAGASINIER' && edbStatusesAfterDirecteurApproval.includes(newStatus)) {
        recipients.add(user.id);
      }

      switch (newStatus) {
        case 'SUBMITTED':
          if (user.employee?.currentDepartmentId === entity.departmentId && 
              (user.role === 'RESPONSABLE' || user.role === 'DIRECTEUR')) {
            recipients.add(user.id);
          }
          break;
        case 'APPROVED_RESPONSABLE':
          if (user.employee?.currentDepartmentId === entity.departmentId && user.role === 'DIRECTEUR') {
            recipients.add(user.id);
          }
          break;
        case 'DELIVERED':
          if (user.employee?.currentDepartmentId === entity.departmentId && 
            (user.role === 'RESPONSABLE' || user.role === 'DIRECTEUR')) {
          recipients.add(user.id);
          }
        case 'APPROVED_DIRECTEUR':
        case 'ESCALATED':
        case 'AWAITING_FINAL_APPROVAL':
          if (user.role === 'DIRECTEUR_GENERAL') {
            recipients.add(user.id);
          }
          break;
        case 'AWAITING_SUPPLIER_CHOICE':
          if (user.access.includes('CHOOSE_SUPPLIER')) {
            recipients.add(user.id);
          }
          break;
        case 'AWAITING_IT_APPROVAL':
          if (user.role === 'IT_ADMIN') {
            recipients.add(user.id);
          }
          break;
      }
    } else {
      switch (newStatus) {
        case 'SUBMITTED':
          if (user.employee?.currentDepartmentId === entity.departmentId && user.role === 'DIRECTEUR') {
            recipients.add(user.id);
          }
          break;
          // Check for Director in RH department by name
          relevantUsers.forEach(user => {
            if (
              user.role === 'DIRECTEUR' && 
              user.employee?.currentDepartment?.name === 'Direction Ressources Humaines'
            ) {
              recipients.add(user.id);
            }
          });
          break;
        case 'RH_PROCESSING':
          if (user.role === 'RH') {
            recipients.add(user.id);
          }
          break;
      }
    }
  });

  return Array.from(recipients);
}

export async function createNotification(
  entityId: string,
  entityType: 'EDB' | 'ODM',
  newStatus: EDBStatus | ODMStatus,
  actorId: number,
  actionInitiator: string
) {
  let entity;
  let numericEntityId: number | undefined;

  if (entityType === 'EDB') {
    entity = await prisma.etatDeBesoin.findUnique({ 
      where: { edbId: entityId },
      select: { id: true, creatorId: true, departmentId: true }
    });
    numericEntityId = entity?.id;
  } else {
    entity = await prisma.ordreDeMission.findUnique({ 
      where: { odmId: entityId },
      select: { id: true, creatorId: true, departmentId: true }
    });
    numericEntityId = entity?.id;
  }

  if (!entity) {
    throw new Error(`${entityType} not found`);
  }

  const recipients = await determineRecipients(entity, newStatus, actorId, entityType);
  const notificationType = getNotificationTypeFromStatus(newStatus, entityType);

  const { subject, body } = generateNotificationMessage({
    id: entityId, // Keep using the string ID for the message
    status: newStatus,
    actionInitiator,
    entityType
  });

  const notification = await prisma.notification.create({
    data: {
      type: notificationType,
      message: body,
      ...(entityType === 'EDB' ? { etatDeBesoinId: numericEntityId } : { ordreDeMissionId: numericEntityId }),
      recipients: {
        create: recipients.map(userId => ({
          userId,
          isRead: false,
          emailSent: false
        }))
      }
    },
    include: {
      recipients: {
        include: {
          user: true
        }
      }
    }
  });

  return { notification, subject, body };
}

