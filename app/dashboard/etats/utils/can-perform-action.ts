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
  | 'ESCALATED'
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
      canValidate = ['SUBMITTED', 'AWAITING_FINAL_APPROVAL'].includes(status);
      canReject = ['SUBMITTED'].includes(status);
      break;
    case 'DIRECTEUR':
      canValidate = ['SUBMITTED','APPROVED_RESPONSABLE', 'AWAITING_FINAL_APPROVAL'].includes(status);
      canReject = ['SUBMITTED', 'APPROVED_RESPONSABLE'].includes(status);
      break;
    case 'IT_ADMIN':
      if (category && ['Logiciels et licences', 'Matériel informatique'].includes(category)) {
        canValidate = status === 'AWAITING_IT_APPROVAL';
        canReject = status === 'AWAITING_IT_APPROVAL';
      }
      break;
    case 'DIRECTEUR_GENERAL':
      canValidate = ['SUBMITTED','APPROVED_RESPONSABLE','ESCALATED', 'APPROVED_DIRECTEUR', 'AWAITING_FINAL_APPROVAL'].includes(status);
      canReject = !['APPROVED_DG', 'REJECTED'].includes(status); // Can reject at any stage except when already approved by DG
      break;
    case 'ADMIN':
      // Admins might have special privileges but in this case, no special actions are allowed
      canValidate = false;
      canReject = false;
      break;
    case 'MAGASINIER':
      canValidate = status === 'AWAITING_MAGASINIER';
      break;
    case 'USER':
      canValidate = status === 'AWAITING_FINAL_APPROVAL';
      canReject = false;
      break;
  }

  return { canValidate, canReject };
}

// Usage example:
// const { canValidate, canReject } = canPerformAction('SUBMITTED', 'RESPONSABLE');