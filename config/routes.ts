import { auth } from "@/lib/auth";

export const routes = {
    home: '/',
    dashboard: {
      home: '/dashboard',
      commandes: '/dashboard/commandes',
      commandesPage: '/dashboard/commandes/page',
      employes: '/dashboard/employes',
      employesPage: '/dashboard/employes/page',
      etats: '/dashboard/etats',
      etatsPage: '/dashboard/etats/page',
      parametres: '/dashboard/parametres',
      parametresPage: '/dashboard/parametres/page',
      myEdbs: '/dashboard/mes-edbs',
      myEdbsPage: '/dashboard/mes-edbs/page',
    },
    auth: "/auth",
  };