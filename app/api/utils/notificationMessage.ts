import { EDBStatus, ODMStatus, NotificationType, EDBEventType, StockEDBStatus } from '@prisma/client';

type EntityContext = {
  id: string;
  status: EDBStatus | ODMStatus | StockEDBStatus;
  actionInitiator: string;
  entityType: 'EDB' | 'ODM' | 'STOCK';
};

const translateStatus = (status: string): string => {
  const statusTranslations: { [key: string]: string } = {
    'DRAFT': 'Brouillon',
    'SUBMITTED': 'Soumis',
    'APPROVED_RESPONSABLE': 'Approuvé par le Service',
    'APPROVED_DIRECTEUR': 'Approuvé par la Direction',
    'APPROVED_DG': 'Approuvé par la Direction Générale',
    'AWAITING_MAGASINIER': 'En attente du Magasinier',
    'MAGASINIER_ATTACHED': 'Document attaché par le Magasinier',
    'AWAITING_SUPPLIER_CHOICE': 'En attente du choix du fournisseur',
    'SUPPLIER_CHOSEN': 'Fournisseur choisi',
    'DELIVERED': 'Livré',
    'AWAITING_IT_APPROVAL': 'En attente d\'approbation IT',
    'IT_APPROVED': 'Approuvé par IT',
    'AWAITING_FINAL_APPROVAL': 'En attente d\'approbation finale',
    'ESCALATED': 'Escaladé',
    'REJECTED': 'Rejeté',
    'FINAL_APPROVAL': 'Approbation finale',
    'COMPLETED': 'Traité',
  };

  return statusTranslations[status] || status;
};

export function generateNotificationMessage(
  context: EntityContext
): { subject: string; body: string } {
  if (context.entityType === 'EDB') {
    return generateEDBNotificationMessage(context);
  } else if (context.entityType === 'ODM') {
    return generateODMNotificationMessage(context);
  } else {
    return generateStockEDBMessage(context);
  }
}

function generateEDBNotificationMessage(
  context: EntityContext
): { subject: string; body: string } {
  const { id, status, actionInitiator } = context;
  let subject = `Mise à jour de l'état de besoin (${id})`;
  let body = '';

  switch (status) {
    case 'SUBMITTED':
      subject = `Nouvel EDB (${id}) créé`;
      body = `Un nouvel état de besoin (${id}) a été créé par ${actionInitiator} et nécessite une approbation.`;
      break;
    case 'APPROVED_RESPONSABLE':
      body = `L'état de besoin (${id}) a été approuvé par le service (${actionInitiator}) et nécessite l'approbation de la direction.`;
      break;
    case 'APPROVED_DIRECTEUR':
      body = `L'état de besoin (${id}) a été approuvé par la direction (${actionInitiator}) et passe à l'étape suivante: Traitement par le service d'achat.`;
      break;
    case 'ESCALATED':
      subject = `EDB (${id}) escaladé à la Direction Générale`;
      body = `L'état de besoin (${id}) a été escaladé à la Direction Générale pour approbation par ${actionInitiator}.`;
      break;
    case 'AWAITING_MAGASINIER':
      body = `L'état de besoin (${id}) est en attente de traitement par le magasinier.`;
      break;
    case 'MAGASINIER_ATTACHED':
      body = `Le magasinier ${actionInitiator} a attaché les documents nécessaires à l'EDB (${id}).`;
      break;
    case 'AWAITING_SUPPLIER_CHOICE':
      body = `L'état de besoin (${id}) est prêt pour le choix du fournisseur.`;
      break;
    case 'SUPPLIER_CHOSEN':
      body = `Un fournisseur a été choisi pour l'état de besoin (${id}) par ${actionInitiator}.`;
      break;
    case 'DELIVERED':
      subject = `Articles de l'EDB livrés`;
      body = `Les articles de l'état de besoin (${id}) sont disponibles chez le magasinier.`;
      break;
    case 'AWAITING_IT_APPROVAL':
      body = `L'état de besoin (${id}) nécessite l'approbation du service IT.`;
      break;
    case 'IT_APPROVED':
      body = `L'état de besoin (${id}) a été approuvé par le service IT (${actionInitiator}).`;
      break;
    case 'AWAITING_FINAL_APPROVAL':
      body = `L'état de besoin (${id}) est en attente de l'approbation finale.`;
      break;
    case 'APPROVED_DG':
      subject = `EDB (${id}) approuvé par la Direction Générale`;
      body = `L'état de besoin (${id}) a été approuvé par la Direction Générale (${actionInitiator}).`;
      break;
    case 'REJECTED':
      subject = `EDB (${id}) rejeté`;
      body = `L'état de besoin (${id}) a été rejeté par ${actionInitiator}.`;
      break;
    case 'COMPLETED':
      subject = `EDB (${id}) traité`;
      body = `L'état de besoin (${id}) a été marqué comme pourvu par ${actionInitiator}.`;
      break;
    default:
      body = `Une mise à jour a été effectuée sur l'EDB (${id}) par ${actionInitiator}. Nouveau statut : ${translateStatus(status)}`;
  }

  return { subject, body };
}

function generateODMNotificationMessage(
  context: EntityContext
): { subject: string; body: string } {
  const { id, status, actionInitiator } = context;
  let subject = `Mise à jour de l'ODM (${id})`;
  let body = '';

  switch (status) {
    case 'SUBMITTED':
      subject = `Nouvel ODM (${id}) créé`;
      body = `Un nouvel ordre de mission (${id}) a été créé par ${actionInitiator}.`;
      break;
    case 'AWAITING_DIRECTOR_APPROVAL':
      body = `L'ordre de mission (${id}) est en attente d'approbation par le directeur.`;
      break;
    case 'AWAITING_RH_PROCESSING':
      body = `L'ordre de mission (${id}) a été approuvé par la direction - ${actionInitiator}.`;
      break;
    case 'RH_PROCESSING':
      body = `L'ordre de mission (${id}) a été approuvé. En cours de traitement par les Ressources Humaines (${actionInitiator}).`;
      break;
    case 'AWAITING_FINANCE_APPROVAL':
      body = `L'ordre de mission (${id}) a été traité par les Ressources Humaines et nécessite l'approbation de la Direction Administrative et Financière.`;
      break;
    case 'COMPLETED':
      subject = `ODM (${id}) traité`;
      body = `L'ordre de mission (${id}) a été approuvé par la Direction Administrative et Financière (${actionInitiator}).`;
      break;
    case 'REJECTED':
      subject = `ODM (${id}) rejeté`;
      body = `L'ordre de mission (${id}) a été rejeté par ${actionInitiator}.`;
      break;
    default:
      body = `Une mise à jour a été effectuée sur l'ODM (${id}) par ${actionInitiator}. Nouveau statut : ${status}`;
  }

  return { subject, body };
}

function generateStockEDBMessage(
  context: EntityContext
): { subject: string, body: string} {
  const { id, status, actionInitiator } = context;
  let subject = `Mise à jour de l'EDB (${id}) - (Stock)`;
  let body = '';

  switch (status){
    case 'SUBMITTED':
      subject = `Nouvel EDB (${id}) créé - (Stock)`;
      body = `Un nouvel état de besoin (${id}) - (stock) a été créé par ${actionInitiator}.`;
      break;
    case 'DELIVERED':
      subject = `Articles de l'EDB livrés`;
      body = `L'état de besoin (${id}) - (stock) a été marqué comme livré par le Service d'Achat - ${actionInitiator}.`;
      break;
    case 'CONVERTED':
      subject = `Conversion de l'EDB`;
      body = `L'état de besoin (${id}) - (stock) a été converti en état de besoin standard par le Service d'Achat et suivra désormais le processus de validation. - ${actionInitiator}`;
      break;

  }

  return { subject, body}
}