// config/notification-config/bdc-rules.ts
import { BDCStatus, Role } from '@prisma/client';
import { keyPersonnel } from './personnel';

type NotificationRule = {
  recipients: string[];
  skipForUsers?: string[]; // Users who bypass this notification
  requiresApprovalExcept?: string[]; // Users who don't need approval at this stage
};

export const bdcNotificationRules: Record<BDCStatus, Record<string, NotificationRule>> = {
  SUBMITTED: {
    DG: {
      recipients: [keyPersonnel.DIRECTEUR_GENERAL],
      requiresApprovalExcept: []
    },
    DAF: {
      recipients: keyPersonnel.DIRECTEUR_DAF,
      requiresApprovalExcept: []
    },
    DOG: {
      recipients: [keyPersonnel.DIRECTEUR_DOG],
      requiresApprovalExcept: [keyPersonnel.MAGASINIER_SENIOR]
    },
    DRH: {
      recipients: [keyPersonnel.DIRECTEUR_DRH],
      requiresApprovalExcept: []
    },
    DCM: {
      recipients: keyPersonnel.DIRECTEUR_DCM,
      requiresApprovalExcept: []
    }
  },
  APPROVED_RESPONSABLE: {
    ALL: {
      recipients: [...keyPersonnel.DIRECTEUR_DAF],
      skipForUsers: [keyPersonnel.MAGASINIER_SENIOR]
    }
  },
  APPROVED_DIRECTEUR: {
    ALL: {
      recipients: [keyPersonnel.RESPONSABLE_COMPTABILITE],
      skipForUsers: [keyPersonnel.MAGASINIER_SENIOR]
    }
  },
  PRINTED: {
    ALL: {
      recipients: [keyPersonnel.CAISSIER]
    }
  },
  REJECTED: {
    // Creator will be notified in the code
    ALL: {
      recipients: []
    }
  },
  UPDATED: {
    ALL: {
      recipients: []
    }
  }
};