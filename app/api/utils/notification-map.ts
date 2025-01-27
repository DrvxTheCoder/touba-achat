// config/notification-map.ts
import { NotificationMap } from "./notification-config";
import { keyPersonnel, getMagasiniers, getDirectorsByDepartment } from './personnel-roles';

const createNotificationMap = (): NotificationMap => ({
  edb: {
    // Direction Générale
    "submitted_dg": [keyPersonnel.DIRECTEUR_GENERAL],
    "approved_dg": getMagasiniers(),
    "magasinier_attached_dg": [keyPersonnel.DIRECTEUR_GENERAL],
    "delivered_dg": [keyPersonnel.DIRECTEUR_GENERAL],

    // Direction Administrative et Financière
    "submitted_daf": keyPersonnel.DIRECTEUR_DAF,
    "approved_daf": getMagasiniers(),
    "magasinier_attached_daf": keyPersonnel.DIRECTEUR_DAF,
    "delivered_daf": keyPersonnel.DIRECTEUR_DAF,

    // Direction des Opérations Générales
    "submitted_dog": [keyPersonnel.DIRECTEUR_DOG],
    "approved_dog": getMagasiniers(),
    "magasinier_attached_dog": [keyPersonnel.DIRECTEUR_DOG],
    "delivered_dog": [keyPersonnel.DIRECTEUR_DOG],

    // Direction des Ressources Humaines
    "submitted_drh": [keyPersonnel.DIRECTEUR_RH],
    "approved_drh": getMagasiniers(),
    "magasinier_attached_drh": [keyPersonnel.DIRECTEUR_RH],
    "delivered_drh": [keyPersonnel.DIRECTEUR_RH],

    // Direction Commerciale
    "submitted_dcm": keyPersonnel.DIRECTEUR_DCM,
    "approved_dcm": getMagasiniers(),
    "magasinier_attached_dcm": keyPersonnel.DIRECTEUR_DCM,
    "delivered_dcm": keyPersonnel.DIRECTEUR_DCM,

    // Special cases
    "awaiting_supplier_choice": [keyPersonnel.DIRECTEUR_GENERAL],
    "awaiting_supplier_choice_it": keyPersonnel.IT_ADMIN,
    "awaiting_final_approval": [keyPersonnel.DIRECTEUR_GENERAL]
  },

  odm: {
    "submitted_dg": [keyPersonnel.DIRECTEUR_GENERAL],
    "approved_dg": [keyPersonnel.DIRECTEUR_RH],
    "approved_by_drh_dg": [keyPersonnel.DIRECTEUR_GENERAL, keyPersonnel.ASSISTANT_RH],
    "processed_by_drh_dg": [keyPersonnel.DIRECTEUR_GENERAL],
    
    "submitted_daf": keyPersonnel.DIRECTEUR_DAF,
    "approved_daf": [keyPersonnel.DIRECTEUR_RH],
    "approved_by_drh_daf": [...keyPersonnel.DIRECTEUR_DAF, keyPersonnel.ASSISTANT_RH],
    "processed_by_drh_daf": keyPersonnel.DIRECTEUR_DAF,

    "submitted_dog": [keyPersonnel.DIRECTEUR_DOG],
    "approved_dog": [keyPersonnel.DIRECTEUR_RH],
    "approved_by_drh_dog": [keyPersonnel.DIRECTEUR_DOG, keyPersonnel.ASSISTANT_RH],
    "processed_by_drh_dog": [keyPersonnel.DIRECTEUR_DOG],

    "submitted_dcm": keyPersonnel.DIRECTEUR_DCM,
    "approved_dcm": [keyPersonnel.DIRECTEUR_RH],
    "approved_by_drh_dcm": [...keyPersonnel.DIRECTEUR_DCM, keyPersonnel.ASSISTANT_RH],
    "processed_by_drh_dcm": keyPersonnel.DIRECTEUR_DCM,

    "submitted_drh": [keyPersonnel.DIRECTEUR_RH],
    "approved_drh": [keyPersonnel.DIRECTEUR_RH],
    "approved_by_drh_drh": [keyPersonnel.DIRECTEUR_RH, keyPersonnel.ASSISTANT_RH],
    "processed_by_drh_drh": [keyPersonnel.DIRECTEUR_RH],
    
    // Add other departments as needed...
  },

  bdc: {
    "submitted_dg": [keyPersonnel.DIRECTEUR_GENERAL],
    "approved_dg": [keyPersonnel.RESPONSABLE_COMPTABILITE],
    "approved_by_daf_dg": [keyPersonnel.DIRECTEUR_GENERAL, keyPersonnel.CAISSIER],
    
    "submitted_daf": keyPersonnel.DIRECTEUR_DAF,
    "approved_daf": [keyPersonnel.RESPONSABLE_COMPTABILITE],
    "approved_by_daf_daf": [...keyPersonnel.DIRECTEUR_DAF, keyPersonnel.CAISSIER],

    "submitted_dcm": keyPersonnel.DIRECTEUR_DCM,
    "approved_dcm": [keyPersonnel.RESPONSABLE_COMPTABILITE],
    "approved_by_daf_dcm": [...keyPersonnel.DIRECTEUR_DCM, keyPersonnel.CAISSIER],

    "submitted_dog": [keyPersonnel.DIRECTEUR_DOG],
    "approved_dog": [keyPersonnel.RESPONSABLE_COMPTABILITE],
    "approved_by_daf_dog": [keyPersonnel.DIRECTEUR_DOG, keyPersonnel.CAISSIER],

    "submitted_drh": [keyPersonnel.DIRECTEUR_RH],
    "approved_drh": [keyPersonnel.RESPONSABLE_COMPTABILITE],
    "approved_by_daf_drh": [keyPersonnel.DIRECTEUR_RH, keyPersonnel.CAISSIER],
    
    // Add other departments as needed...
  },

  "stock-edb": {
    submitted: [keyPersonnel.MAGASINIER_1, keyPersonnel.MAGASINIER_2]
  }
});

// Export a frozen version of the notification map
export const notificationMap = Object.freeze(createNotificationMap());