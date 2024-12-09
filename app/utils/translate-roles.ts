export const translateRole = (role: string | undefined): string => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'USER':
        return 'Utilisateur';
      case 'RESPONSABLE':
        return 'Responsable';
      case 'DIRECTEUR':
        return 'Directeur';
      case 'DIRECTEUR_GENERAL':
        return 'Directeur Général';
      case 'MAGASINIER':
        return 'Magasinier';
      case 'RH':
        return 'Ressources Humaines';
      case 'DAF':
        return 'DAF';
      case 'AUDIT':
        return 'Auditeur';
      case 'IT_ADMIN':
        return 'Administrateur IT';
      default:
        return 'Role';
    }
  };