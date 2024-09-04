//notificationMessade.ts
import { EDBEventType, ODMEventType, EDBStatus, ODMStatus, NotificationType } from '@prisma/client';

type EntityContext = {
  id: string;
  status?: EDBStatus | ODMStatus;
  userName?: string;
};

export function generateNotificationMessage(
  action: EDBEventType | ODMEventType,
  context: EntityContext,
  entityType: 'EDB' | 'ODM'
): string {
  if (entityType === 'EDB') {
    return generateEDBNotificationMessage(action as EDBEventType, context);
  } else {
    return generateODMNotificationMessage(action as ODMEventType, context);
  }
}

export function generateEDBNotificationMessage(
  action: EDBEventType,
  context: EntityContext
): string {
  switch (action) {
    case EDBEventType.SUBMITTED:
      return `Nouvel EDB #${context.id} créé par ${context.userName}.`;
    case EDBEventType.APPROVED_RESPONSABLE:
      return `EDB #${context.id} a été approuvé par le service - ${context.userName}.`;
    case EDBEventType.APPROVED_DIRECTEUR:
      return `EDB #${context.id} a été approuvé par la Direction - ${context.userName}.`;
    case EDBEventType.ESCALATED:
      return `EDB #${context.id} a été escaladé à la Direction Générale pour approbation.`;
    case EDBEventType.APPROVED_DG:
      return `EDB #${context.id} a été approuvé par la Direction Générale.`;
    case EDBEventType.MAGASINIER_ATTACHED:
      return `Facture(s) rattachée(s) à l'EDB #${context.id} par le service d'achat.`;
    case EDBEventType.SUPPLIER_CHOSEN:
      return `Un fournisseur final a été choisi pour l'EDB #${context.id}.`;
    case EDBEventType.FINAL_APPROVAL:
      return `L'approbation finale de l'EDB #${context.id} effectué par : ${context.userName}.`;
    case EDBEventType.COMPLETED:
      return `L'EDB #${context.id} a été marqué comme pourvu par le Service d'Achat : ${context.userName}.`;
    case EDBEventType.IT_APPROVED:
      return `L'EDB #${context.id} a été approuvé par le Service IT.`;
    case EDBEventType.REJECTED:
      return `L'EDB #${context.id} a été rejeté.`;
    default:
      return `Une mise à jour a été effectuée sur l'EDB #${context.id}.`;
  }
}

export function generateODMNotificationMessage(
  action: ODMEventType,
  context: EntityContext
): string {
  switch (action) {
    case ODMEventType.SUBMITTED:
      return `Nouvel ODM #${context.id} créé par ${context.userName}.`;
    case ODMEventType.AWAITING_RH_PROCESSING:
      return `ODM #${context.id} a été approuvé par la Direction - ${context.userName}.`;
    case ODMEventType.RH_PROCESSING:
      return `ODM #${context.id} a été approuvé par les Ressources Humaines - ${context.userName}.`;
    case ODMEventType.COMPLETED:
      return `ODM #${context.id} a été traité par les Resssources Humaines - ${context.userName}.`;
    case ODMEventType.REJECTED:
      return `ODM #${context.id} a été rejeté.`; 
    default:
      return `Une mise à jour a été effectuée sur l'ODM #${context.id}.`;
  }
}