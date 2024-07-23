type EDBStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED_RESPONSABLE'
  | 'APPROVED_DIRECTEUR'
  | 'AWAITING_MAGASINIER'
  | 'MAGASINIER_ATTACHED'
  | 'AWAITING_SUPPLIER_CHOICE'
  | 'SUPPLIER_CHOSEN'
  | 'AWAITING_IT_APPROVAL'
  | 'IT_APPROVED'
  | 'AWAITING_FINAL_APPROVAL'
  | 'APPROVED_DG'
  | 'REJECTED'
  | 'COMPLETED';

type UserRole = 'RESPONSABLE' | 'DIRECTEUR' | 'IT_ADMIN' | 'DIRECTEUR_GENERAL' | 'ADMIN' | 'MAGASINIER' | 'USER';

interface CanPerformActionResult {
  canValidate: boolean;
  canReject: boolean;
}

export function canPerformAction(status: EDBStatus, role: UserRole, category?: string): CanPerformActionResult {
  let canValidate = false;
  let canReject = false;

  switch (role) {
    case 'RESPONSABLE':
      canValidate = ['SUBMITTED', 'REJECTED'].includes(status);
      canReject = ['SUBMITTED'].includes(status);
      break;
    case 'DIRECTEUR':
      canValidate = status === 'APPROVED_RESPONSABLE';
      canReject = ['SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR'].includes(status);
      break;
    case 'IT_ADMIN':
      if (category && ['Logiciels et licences', 'Matériel informatique'].includes(category)) {
        canValidate = status === 'AWAITING_IT_APPROVAL';
        canReject = status === 'AWAITING_IT_APPROVAL';
      }
      break;
    case 'DIRECTEUR_GENERAL':
      canValidate = status === 'AWAITING_FINAL_APPROVAL';
      canReject = true; // Can reject at any stage
      break;
    case 'ADMIN':
      // Admins might have special privileges, adjust as needed
      canValidate = true;
      canReject = true;
      break;
    case 'MAGASINIER':
      // Magasiniers might have specific actions they can perform
      canValidate = status === 'AWAITING_MAGASINIER';
      break;
    case 'USER':
      // Regular users typically can't validate or reject
      break;
  }

  return { canValidate, canReject };
}

// Usage example:
// const { canValidate, canReject } = canPerformAction('SUBMITTED', 'RESPONSABLE');