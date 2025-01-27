// config/personnel-roles.ts

export type KeyPersonnel = {
  // Magasiniers
  MAGASINIER_1: string;
  MAGASINIER_2: string;
  MAGASINIER_3: string;

  // Finance Personnel
  RESPONSABLE_COMPTABILITE: string;
  CAISSIER: string;

  // HR Personnel
  DIRECTEUR_RH: string;
  ASSISTANT_RH: string;

  // Department Directors
  DIRECTEUR_GENERAL: string;
  DIRECTEUR_DAF: string[]; 
  DIRECTEUR_DOG: string;
  DIRECTEUR_DCM: string[];

  // IT Personnel
  IT_ADMIN: string[];
};

export const keyPersonnel: KeyPersonnel = {
  // Magasiniers
  MAGASINIER_1: "keba.gnabaly@touba-oil.com",
  MAGASINIER_2: "service.achat@touba-oil.com",
  MAGASINIER_3: "mdiarra.dieng@touba-oil.com",

  // Finance Personnel
  RESPONSABLE_COMPTABILITE: "beskaye.diop@touba-oil.com",
  CAISSIER: "service.achat@touba-oil.com",  // Same person as MAGASINIER_2

  // HR Personnel
  DIRECTEUR_RH: "ibra.diop@touba-oil.com",
  ASSISTANT_RH: "bineta.dieng@touba-oil.com",

  // Department Directors
  DIRECTEUR_GENERAL: "dseye@touba-oil.com",
  DIRECTEUR_DAF: ["mme.ndour@touba-oil.com", "beskaye.diop@touba-oil.com"],
  DIRECTEUR_DOG: "daouda.badji@touba-oil.com",
  DIRECTEUR_DCM: ["mme.coulibaly@touba-oil.com", "mamadou.diouf@touba-oil.com"],

  // IT Personnel
  IT_ADMIN: ["admin@touba-oil.com", "alboury.ndao@touba-oil.com", "paul.flan@touba-oil.com"],
};

// Helper functions to get role-based recipients
export function getMagasiniers(): string[] {
  return [
    keyPersonnel.MAGASINIER_1,
    keyPersonnel.MAGASINIER_2,
    keyPersonnel.MAGASINIER_3
  ];
}

export function getDirectorsByDepartment(dept: string): string[] {
  switch (dept) {
    case 'dg':
      return [keyPersonnel.DIRECTEUR_GENERAL];
    case 'daf':
      return keyPersonnel.DIRECTEUR_DAF;
    case 'dog':
      return [keyPersonnel.DIRECTEUR_DOG];
    case 'drh':
      return [keyPersonnel.DIRECTEUR_RH];
    case 'dcm':
      return keyPersonnel.DIRECTEUR_DCM;
    default:
      return [];
  }
}