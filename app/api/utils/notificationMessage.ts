// /api/utils/notificationMessages.ts
import { EDBEventType, EDBStatus, NotificationType } from '@prisma/client';

export function generateNotificationMessage(
  action: EDBEventType,
  context: {
    edbId: string;
    status?: EDBStatus;
    userName?: string;
    departmentName?: string;
  }
): string {
  switch (action) {
    case EDBEventType.SUBMITTED:
      return `Nouvel EDB #${context.edbId} créé par ${context.userName} du département ${context.departmentName}.`;
    case EDBEventType.APPROVED_RESPONSABLE:
      return `EDB #${context.edbId} a été approuvé par le service - ${context.userName}.`;
    case EDBEventType.APPROVED_DIRECTEUR:
      return `EDB #${context.edbId} a été approuvé par la Direction - ${context.userName}.`;
    case EDBEventType.ESCALATED:
      return `EDB #${context.edbId} a été escaladé à la Direction Générale pour approbation.`;
    case EDBEventType.APPROVED_DG:
      return `EDB #${context.edbId} a été approuvé par la Direction Générale.`;
    case EDBEventType.MAGASINIER_ATTACHED:
      return `Facture(s) rattachée(s) à l'EDB #${context.edbId} par le service d'achat.`;
    case EDBEventType.SUPPLIER_CHOSEN:
      return `Un fournisseur final a été choisi pour l'EDB #${context.edbId}.`;
    case EDBEventType.FINAL_APPROVAL:
        return `L'approbation finale de l'EDB #${context.edbId} effectué par : ${context.userName}.`
    case EDBEventType.IT_APPROVED:
      return `L'EDB #${context.edbId} a été approuvé par le Service IT.`;
    default:
      return `Une mise à jour a été effectuée sur l'EDB #${context.edbId}.`;
  }
}