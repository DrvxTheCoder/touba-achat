export const translateStatus = (status: string): string => {
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
      'AWAITING_IT_APPROVAL': 'En attente d\'approbation IT',
      'IT_APPROVED': 'Approuvé par IT',
      'AWAITING_FINAL_APPROVAL': 'En attente d\'approbation finale',
      'ESCALATED': 'Escaladé',
      'AWAITING_DIRECTOR_APPROVAL': 'En attente d\'approbation du directeur',
      'AWAITING_RH_PROCESSING': 'Approuvé par les Ressources Humaines',
      'RH_PROCESSING': 'En cours de traitement RH',
      'REJECTED': 'Rejeté',
      'FINAL_APPROVAL': 'Approbation finale',
      'COMPLETED': 'Traité',
    };
  
    return statusTranslations[status] || status;
  };