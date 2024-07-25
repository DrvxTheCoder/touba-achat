export interface EDB {
  id: string;
  queryId: string;
  title: string;
  category: string;
  status: string;
  department: string;
  amount: number;
  email: string;
  items: { designation: string; quantity: number }[]; // Changed from 'name' to 'designation'
  employee: {
    name: string;
    department: string;
    email: string;
  };
  documents: string[];
  date: string;
}
  
  //   {
  //     id: "EDB-5212377",
  //     title: "Fournitures de bureau trimestrielles",
  //     category: "Fournitures de Bureau",
  //     status: "Non-validé",
  //     department: "Direction Administrative & Financière",
  //     amount: 56040,
  //     email: "paul.flan@touba-oil.com",
  //     items: [
  //       { name: "Stylos", quantity: 100 },
  //       { name: "Cahiers", quantity: 50 },
  //       { name: "Classeurs", quantity: 20 },
  //     ],
  //     employee: {
  //       name: "Paul Flan",
  //       department: "Direction Administrative & Financière",
  //       email: "paul.flan@touba-oil.com",
  //     },
  //     documents: ["Pro Forma #1", "Bon de Commande"],
  //     date: "2024-07-10",
  //   },
  //   {
  //     id: "EDB-5612098",
  //     title: "Équipement de sécurité pour le site A",
  //     category: "Matériel Industriel",
  //     status: "Rejeté",
  //     department: "Direction Générale",
  //     amount: 275000,
  //     email: "kemo.camara@touba-oil.com",
  //     items: [
  //       { name: "Casques de sécurité", quantity: 50 },
  //       { name: "Gilets haute visibilité", quantity: 100 },
  //     ],
  //     employee: {
  //       name: "Kemo Camara",
  //       department: "Direction Générale",
  //       email: "kemo.camara@touba-oil.com",
  //     },
  //     documents: ["Pro Forma #1", "Pro Forma #2", "Justification de rejet"],
  //     date: "2024-07-08",
  //   },
  //   {
  //     id: "EDB-8232397",
  //     title: "Renouvellement fournitures direction",
  //     category: "Fournitures de Bureau",
  //     status: "En cours",
  //     department: "Direction Générale",
  //     amount: 75000,
  //     email: "noah.lunsi@touba-oil.com",
  //     items: [
  //       { name: "Papier A4", quantity: 50 },
  //       { name: "Cartouches d'encre", quantity: 10 },
  //     ],
  //     employee: {
  //       name: "Noah Lunsi",
  //       department: "Direction Générale",
  //       email: "noah.lunsi@touba-oil.com",
  //     },
  //     documents: ["Facture", "Bon de livraison"],
  //     date: "2024-07-05",
  //   },
  //   {
  //     id: "EDB-12122775",
  //     title: "Mise à niveau équipements informatiques",
  //     category: "Équipement Informatique",
  //     status: "Validé",
  //     department: "Direction Administrative & Financière",
  //     amount: 89900,
  //     email: "djamila.sylla@touba-oil.com",
  //     items: [
  //       { name: "Moniteur HP 24 Pouces - HP24Zn", quantity: 1 },
  //       { name: "Adaptateur USB-C", quantity: 1 },
  //     ],
  //     employee: {
  //       name: "Djamila Sylla",
  //       department: "Direction Administrative & Financière",
  //       email: "djamila.sylla@touba-oil.com",
  //     },
  //     documents: ["Pro Forma #1", "Pro Forma #2", "Bon de Decaissement"],
  //     date: "2024-06-06",
  //   },
  //   {
  //     id: "EDB-12135654",
  //     title: "Renouvellement parc informatique RH",
  //     category: "Équipement Informatique",
  //     status: "Délivré",
  //     department: "Direction Ressources Humaines",
  //     amount: 1500000,
  //     email: "emma.louhess@touba-oil.com",
  //     items: [
  //       { name: "Ordinateurs portables", quantity: 10 },
  //       { name: "Stations d'accueil", quantity: 10 },
  //     ],
  //     employee: {
  //       name: "Emma Louhess",
  //       department: "Direction Ressources Humaines",
  //       email: "emma.louhess@touba-oil.com",
  //     },
  //     documents: ["Facture", "Bon de livraison", "Rapport de configuration"],
  //     date: "2024-07-01",
  //   },
  //   {
  //       id: "EDB-9876543",
  //       title: "Réparation et maintenance véhicules",
  //       category: "Services Généraux",
  //       status: "En cours",
  //       department: "Direction Logistique",
  //       amount: 120000,
  //       email: "adam.diallo@touba-oil.com",
  //       items: [
  //         { name: "Révision moteur", quantity: 5 },
  //         { name: "Changement pneus", quantity: 10 },
  //         { name: "Réparation carrosserie", quantity: 2 },
  //       ],
  //       employee: {
  //         name: "Adam Diallo",
  //         department: "Direction Logistique",
  //         email: "adam.diallo@touba-oil.com",
  //       },
  //       documents: ["Devis", "Ordre de réparation"],
  //       date: "2024-07-10",
  //     },
  //     {
  //       id: "EDB-8765432",
  //       title: "Formation en gestion de projet",
  //       category: "Formation",
  //       status: "Validé",
  //       department: "Direction des Ressources Humaines",
  //       amount: 45000,
  //       email: "marie.ndiaye@touba-oil.com",
  //       items: [
  //         { name: "Manuels de formation", quantity: 15 },
  //         { name: "Salle de formation", quantity: 1 },
  //       ],
  //       employee: {
  //         name: "Marie Ndiaye",
  //         department: "Direction des Ressources Humaines",
  //         email: "marie.ndiaye@touba-oil.com",
  //       },
  //       documents: ["Contrat de formation", "Attestation de présence"],
  //       date: "2024-06-25",
  //     },
  //     {
  //       id: "EDB-7654321",
  //       title: "Achat de nouveaux uniformes",
  //       category: "Fournitures Générales",
  //       status: "Délivré",
  //       department: "Direction de la Sécurité",
  //       amount: 60000,
  //       email: "amine.sow@touba-oil.com",
  //       items: [
  //         { name: "Chemises", quantity: 50 },
  //         { name: "Pantalons", quantity: 50 },
  //         { name: "Casquettes", quantity: 50 },
  //       ],
  //       employee: {
  //         name: "Amine Sow",
  //         department: "Direction de la Sécurité",
  //         email: "amine.sow@touba-oil.com",
  //       },
  //       documents: ["Facture", "Bon de livraison"],
  //       date: "2024-07-03",
  //     },
  //     {
  //       id: "EDB-6543210",
  //       title: "Réaménagement des espaces communs",
  //       category: "Travaux d'Aménagement",
  //       status: "Non-validé",
  //       department: "Direction Générale",
  //       amount: 180000,
  //       email: "sophie.diop@touba-oil.com",
  //       items: [
  //         { name: "Mobilier de réception", quantity: 5 },
  //         { name: "Éclairage LED", quantity: 20 },
  //       ],
  //       employee: {
  //         name: "Sophie Diop",
  //         department: "Direction Générale",
  //         email: "sophie.diop@touba-oil.com",
  //       },
  //       documents: ["Devis détaillé", "Plans d'aménagement"],
  //       date: "2024-06-30",
  //     },
  //     {
  //       id: "EDB-5432109",
  //       title: "Amélioration des outils de communication interne",
  //       category: "Technologie de l'Information",
  //       status: "En cours",
  //       department: "Direction Informatique",
  //       amount: 95000,
  //       email: "alioune.gueye@touba-oil.com",
  //       items: [
  //         { name: "Serveurs", quantity: 2 },
  //         { name: "Licences logicielles", quantity: 50 },
  //       ],
  //       employee: {
  //         name: "Alioune Gueye",
  //         department: "Direction Informatique",
  //         email: "alioune.gueye@touba-oil.com",
  //       },
  //       documents: ["Devis", "Contrat de maintenance"],
  //       date: "2024-07-07",
  //     },
  // ];
  