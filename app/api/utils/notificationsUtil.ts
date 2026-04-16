import { PrismaClient, EDBStatus, ODMStatus, NotificationType, Role, EDBEventType, ODMEventType, Access, StockEDBStatus } from '@prisma/client';
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

export function getNotificationTypeFromStatus(status: EDBStatus | ODMStatus | StockEDBStatus, entityType: 'EDB' | 'ODM' | 'STOCK'): NotificationType {
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
  } else if (entityType === 'STOCK') {
    switch (status) {
      case 'SUBMITTED':
        return NotificationType.EDB_CREATED;
      case 'DELIVERED':
        return NotificationType.EDB_DELIVERED;
      case 'CONVERTED':
        return NotificationType.EDB_CONVERTED;
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

// ─── ODM recipient logic ──────────────────────────────────────────────────────

async function addODMRecipients(_entity: any, status: ODMStatus, recipients: Set<number>) {
  switch (status) {
    case 'SUBMITTED': {
      // Notify all roles that can approve at the director stage
      const approvers = await prisma.user.findMany({
        where: { role: { in: ['DIRECTEUR', 'DIRECTEUR_GENERAL', 'ADMIN', 'DAF', 'DOG', 'DCM', 'DRH'] } },
        select: { id: true },
      });
      approvers.forEach(u => recipients.add(u.id));
      break;
    }
    case 'AWAITING_DRH_APPROVAL': {
      // DRH needs to send the ODM to RH processing
      const drhUsers = await prisma.user.findMany({
        where: { role: { in: ['DRH', 'ADMIN'] } },
        select: { id: true },
      });
      drhUsers.forEach(u => recipients.add(u.id));
      break;
    }
    case 'RH_PROCESSING':
    case 'AWAITING_RH_PROCESSING': {
      // RH users need to process the ODM
      const rhUsers = await prisma.user.findMany({
        where: { role: { in: ['RH', 'DRH', 'ADMIN'] } },
        select: { id: true },
      });
      rhUsers.forEach(u => recipients.add(u.id));
      break;
    }
    case 'AWAITING_DRH_VALIDATION': {
      // DRH needs to validate the RH work before it goes to DOG
      const drhUsers = await prisma.user.findMany({
        where: { role: { in: ['DRH', 'ADMIN'] } },
        select: { id: true },
      });
      drhUsers.forEach(u => recipients.add(u.id));
      break;
    }
    case 'AWAITING_DOG_APPROVAL':
    case 'AWAITING_FINANCE_APPROVAL': {
      // DOG needs to give final approval
      const dogUsers = await prisma.user.findMany({
        where: { role: { in: ['DOG', 'DAF', 'ADMIN'] } },
        select: { id: true },
      });
      dogUsers.forEach(u => recipients.add(u.id));
      break;
    }
    // READY_FOR_PRINT, REJECTED, COMPLETED → creator only (already added in determineRecipients)
  }
}

// ─── EDB recipient logic ──────────────────────────────────────────────────────

const EDB_POST_DIRECTOR_STATUSES: EDBStatus[] = [
  'APPROVED_DIRECTEUR', 'ESCALATED', 'AWAITING_MAGASINIER', 'MAGASINIER_ATTACHED',
  'AWAITING_SUPPLIER_CHOICE', 'SUPPLIER_CHOSEN', 'AWAITING_IT_APPROVAL', 'IT_APPROVED',
  'AWAITING_FINAL_APPROVAL', 'APPROVED_DG', 'DELIVERED', 'COMPLETED',
];

async function addEDBRecipients(entity: any, status: EDBStatus, recipients: Set<number>) {
  // Notify MAGASINIER for all post-director approval statuses (they track the order lifecycle)
  if (EDB_POST_DIRECTOR_STATUSES.includes(status)) {
    const magasiniers = await prisma.user.findMany({
      where: { role: 'MAGASINIER' },
      select: { id: true },
    });
    magasiniers.forEach(u => recipients.add(u.id));
  }

  switch (status) {
    case 'SUBMITTED': {
      // Responsable and Director of the submitter's department need to approve
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['RESPONSABLE', 'DIRECTEUR'] },
          employee: { currentDepartmentId: entity.departmentId },
        },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
    case 'APPROVED_RESPONSABLE': {
      // Director of the department needs to approve next
      const users = await prisma.user.findMany({
        where: {
          role: 'DIRECTEUR',
          employee: { currentDepartmentId: entity.departmentId },
        },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
    case 'APPROVED_DIRECTEUR':
    case 'ESCALATED':
    case 'AWAITING_FINAL_APPROVAL': {
      // DG needs to give final approval
      const users = await prisma.user.findMany({
        where: { role: 'DIRECTEUR_GENERAL' },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
    case 'AWAITING_SUPPLIER_CHOICE': {
      const users = await prisma.user.findMany({
        where: { access: { has: 'CHOOSE_SUPPLIER' as Access } },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
    case 'AWAITING_IT_APPROVAL': {
      const users = await prisma.user.findMany({
        where: { role: 'IT_ADMIN' },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
    case 'DELIVERED': {
      // Notify the department that their order has been delivered
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['RESPONSABLE', 'DIRECTEUR'] },
          employee: { currentDepartmentId: entity.departmentId },
        },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
    // REJECTED, APPROVED_DG, COMPLETED → creator only (already added in determineRecipients)
  }
}

// ─── STOCK recipient logic ────────────────────────────────────────────────────

async function addSTOCKRecipients(entity: any, status: StockEDBStatus, recipients: Set<number>) {
  switch (status) {
    case 'SUBMITTED':
    case 'DELIVERED': {
      const magasiniers = await prisma.user.findMany({
        where: { role: 'MAGASINIER' },
        select: { id: true },
      });
      magasiniers.forEach(u => recipients.add(u.id));
      break;
    }
    case 'CONVERTED': {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['RESPONSABLE', 'DIRECTEUR', 'DIRECTEUR_GENERAL'] },
          employee: { currentDepartmentId: entity.departmentId },
        },
        select: { id: true },
      });
      users.forEach(u => recipients.add(u.id));
      break;
    }
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function determineRecipients(
  entity: any,
  newStatus: EDBStatus | ODMStatus | StockEDBStatus,
  _actorId: number,
  entityType: 'EDB' | 'ODM' | 'STOCK'
): Promise<number[]> {
  const recipients = new Set<number>();

  // Always notify the creator (STOCK uses employeeId instead of creatorId)
  const creatorId = entity.creatorId ?? entity.employeeId;
  if (creatorId) recipients.add(creatorId);

  if (entityType === 'ODM') {
    await addODMRecipients(entity, newStatus as ODMStatus, recipients);
  } else if (entityType === 'EDB') {
    await addEDBRecipients(entity, newStatus as EDBStatus, recipients);
  } else if (entityType === 'STOCK') {
    await addSTOCKRecipients(entity, newStatus as StockEDBStatus, recipients);
  }

  return Array.from(recipients);
}

export async function createNotification(
  entityId: string,
  entityType: 'EDB' | 'ODM' | 'STOCK',
  newStatus: EDBStatus | ODMStatus | StockEDBStatus,
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
  } else if (entityType === 'STOCK') {
    entity = await prisma.stockEtatDeBesoin.findUnique({
      where: { edbId: entityId },
      select: { id: true, employeeId: true, departmentId: true }
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
    id: entityId,
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
