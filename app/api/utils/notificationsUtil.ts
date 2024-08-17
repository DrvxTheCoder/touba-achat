import { PrismaClient, EDBEventType, EtatDeBesoin, User, Prisma, EDBStatus, AttachmentType, NotificationType, Role } from '@prisma/client';
const prisma = new PrismaClient();

// Helper function to get the appropriate EDBEventType based on the new status
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
// Helper function to get the appropriate EDBNotificationType based on the new status
export function getNotificationTypeFromStatus(status: EDBStatus): NotificationType {
  switch (status) {
    case 'DRAFT':
    case 'SUBMITTED':
      return NotificationType.EDB_CREATED;
    case 'APPROVED_RESPONSABLE':
      return NotificationType.EDB_APPROVED_SUPERIOR;
    case 'APPROVED_DIRECTEUR':
      return NotificationType.EDB_APPROVED_DIRECTOR;
    case 'ESCALATED':
      return NotificationType.EDB_ESCALATED;
    case 'APPROVED_DG':
      return NotificationType.EDB_APPROVED_DG;
    case 'REJECTED':
      return NotificationType.EDB_REJECTED;
    case 'AWAITING_MAGASINIER':
    case 'MAGASINIER_ATTACHED':
    case 'AWAITING_SUPPLIER_CHOICE':
    case 'SUPPLIER_CHOSEN':
    case 'AWAITING_IT_APPROVAL':
    case 'IT_APPROVED':
    case 'AWAITING_FINAL_APPROVAL':
    case 'COMPLETED':
      // For these statuses, we don't have specific notification types defined.
      // You might want to create new notification types for these or use a generic one.
      return NotificationType.EDB_CREATED; // Using this as a fallback, but you might want to define a more appropriate type
    default:
      console.warn(`Unhandled EDB status for notification: ${status}`);
      return NotificationType.EDB_CREATED; // Default case, you might want to handle this differently
  }
}

export async function determineRecipients(edb: EtatDeBesoin, newStatus: EDBStatus, actorId: number): Promise<number[]> {
  const recipients = new Set<number>();

  // Fetch all relevant users in one query
  const relevantUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: edb.creatorId },
        { id: actorId },
        { 
          employee: { 
            currentDepartmentId: edb.departmentId,
            OR: [
              { user: { role: 'RESPONSABLE' } },
              { user: { role: 'DIRECTEUR' } }
            ]
          }
        },
        { role: 'DIRECTEUR_GENERAL' },
        { role: 'MAGASINIER' },
        { role: 'IT_ADMIN' },
        { access: { has: 'CHOOSE_SUPPLIER' } }
      ]
    },
    select: {
      id: true,
      role: true,
      access: true,
      employee: {
        select: {
          currentDepartmentId: true
        }
      }
    }
  });

  // Always notify the creator and the actor
  recipients.add(edb.creatorId);
  // recipients.add(actorId);

  // Determine other recipients based on the new status
  switch (newStatus) {
    case 'SUBMITTED':
      relevantUsers.forEach(user => {
        if (user.employee?.currentDepartmentId === edb.departmentId && 
            (user.role === 'RESPONSABLE' || user.role === 'DIRECTEUR')) {
          recipients.add(user.id);
        }
      });
      break;
    case 'APPROVED_RESPONSABLE':
      relevantUsers.forEach(user => {
        if (user.employee?.currentDepartmentId === edb.departmentId && user.role === 'DIRECTEUR') {
          recipients.add(user.id);
        }
      });
      break;
    case 'APPROVED_DIRECTEUR':
    case 'ESCALATED':
    case 'AWAITING_FINAL_APPROVAL':
      relevantUsers.forEach(user => {
        if (user.role === 'DIRECTEUR_GENERAL') {
          recipients.add(user.id);
        }
      });
      break;
    case 'AWAITING_MAGASINIER':
      relevantUsers.forEach(user => {
        if (user.role === 'MAGASINIER') {
          recipients.add(user.id);
        }
      });
      break;
    case 'AWAITING_SUPPLIER_CHOICE':
      relevantUsers.forEach(user => {
        if (user.access.includes('CHOOSE_SUPPLIER')) {
          recipients.add(user.id);
        }
      });
      break;
    case 'AWAITING_IT_APPROVAL':
      relevantUsers.forEach(user => {
        if (user.role === 'IT_ADMIN') {
          recipients.add(user.id);
        }
      });
      break;
  }

  return Array.from(recipients);
}