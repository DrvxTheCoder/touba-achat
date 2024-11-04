import { Role, Access, EDBStatus } from '@prisma/client';

type UserContext = {
  role: Role;
  access?: Access[];
};

interface CanPerformActionResult {
  canValidate: boolean;
  canReject: boolean;
  canAttachDocuments: boolean;
  canChooseSupplier: boolean;
  canGiveFinalApproval: boolean;
  canApproveIT: boolean;
}

export function canPerformAction(
  status: EDBStatus, 
  userContext: UserContext,
  category?: string
): CanPerformActionResult {
  const { role, access = [] } = userContext;
  
  // Initialize result with all permissions set to false
  const result: CanPerformActionResult = {
    canValidate: false,
    canReject: false,
    canAttachDocuments: false,
    canChooseSupplier: false,
    canGiveFinalApproval: false,
    canApproveIT: false
  };

  // Check access-based permissions first
  if (access.includes(Access.APPROVE_EDB)) {
    result.canValidate = ['SUBMITTED', 'APPROVED_RESPONSABLE', 'AWAITING_FINAL_APPROVAL'].includes(status);
    result.canReject = ['SUBMITTED', 'APPROVED_RESPONSABLE'].includes(status);
  }

  if (access.includes(Access.ATTACH_DOCUMENTS)) {
    result.canAttachDocuments = status === 'AWAITING_MAGASINIER';
  }

  if (access.includes(Access.CHOOSE_SUPPLIER)) {
    result.canChooseSupplier = status === 'AWAITING_SUPPLIER_CHOICE';
  }

  if (access.includes(Access.IT_APPROVAL) && category && ['Logiciels et licences', 'Matériel informatique'].includes(category)) {
    result.canApproveIT = status === 'AWAITING_IT_APPROVAL';
  }

  if (access.includes(Access.FINAL_APPROVAL)) {
    result.canGiveFinalApproval = status === 'AWAITING_FINAL_APPROVAL';
  }

  // Then check role-based permissions if no access-based permissions are granted
  if (!result.canValidate && !result.canReject) {
    switch (role) {
      case 'RESPONSABLE':
        result.canValidate = ['SUBMITTED', 'AWAITING_FINAL_APPROVAL'].includes(status);
        result.canReject = ['SUBMITTED'].includes(status);
        break;
      case 'DIRECTEUR':
        result.canValidate = ['SUBMITTED', 'APPROVED_RESPONSABLE', 'AWAITING_FINAL_APPROVAL'].includes(status);
        result.canReject = ['SUBMITTED', 'APPROVED_RESPONSABLE'].includes(status);
        break;
      case 'IT_ADMIN':
        if (category && ['Logiciels et licences', 'Matériel informatique'].includes(category)) {
          result.canValidate = ['AWAITING_IT_APPROVAL'].includes(status);
          result.canReject = status === 'AWAITING_IT_APPROVAL';
          result.canApproveIT = true;
        }
        break;
      case 'DIRECTEUR_GENERAL':
        result.canValidate = ['SUBMITTED', 'APPROVED_RESPONSABLE', 'ESCALATED', 'APPROVED_DIRECTEUR', 'AWAITING_FINAL_APPROVAL'].includes(status);
        result.canReject = !['APPROVED_DG', 'REJECTED', 'COMPLETED'].includes(status);
        result.canGiveFinalApproval = true;
        break;
      case 'MAGASINIER':
        result.canValidate = status === 'AWAITING_MAGASINIER';
        result.canAttachDocuments = status === 'AWAITING_MAGASINIER';
        result.canChooseSupplier = status === 'AWAITING_SUPPLIER_CHOICE';
        break;
    }
  }

  return result;
}

// Helper function to check if a user has specific access
export function hasAccess(userAccess: Access[] | undefined, requiredAccess: Access): boolean {
  return userAccess?.includes(requiredAccess) ?? false;
}

// Example usage:
/*
const userContext = {
  role: 'DIRECTEUR' as Role,
  access: [Access.APPROVE_EDB, Access.FINAL_APPROVAL]
};

const permissions = canPerformAction('SUBMITTED', userContext, 'Matériel informatique');

// Example with both role and access rights
if (permissions.canValidate || hasAccess(userContext.access, Access.APPROVE_EDB)) {
  // User can validate either by role or explicit access right
}
*/