// lib/types/production.ts

import { ProductionStatus, ArretType, BottleType, ReservoirType } from '@prisma/client';

export interface ProductionArret {
  id: number;
  inventoryId: number;
  type: ArretType;
  duree: number; // En minutes - saisie manuelle
  remarque?: string;
  createdAt: Date | string;
  createdById: number;
  createdBy?: {
    id: number;
    name: string;
  };
}

export interface BottleProduction {
  id: number;
  inventoryId: number;
  type: BottleType;
  quantity: number;
  tonnage: number;
}

export interface Reservoir {
  id: number;
  inventoryId: number;
  name: ReservoirType;
  hauteur: number;
  poids: number;
}

export interface ProductionInventory {
  id: number;
  date: Date | string;
  status: ProductionStatus;
  productionCenterId?: number | null;
  startedAt: Date | string;
  startedById: number;
  completedAt?: Date | string | null;
  completedById?: number | null;

  // Temps de production
  tempsTotal: number; // En minutes
  tempsArret: number;
  tempsUtile: number;
  rendement?: number | null;

  // Stocks
  stockInitialPhysique: number;
  butanier?: number | null;
  recuperation: number;
  approSAR: number;

  // Calculés
  cumulSortie: number;
  stockFinalTheorique?: number | null;
  stockFinalPhysique?: number | null;
  ecart?: number | null;
  ecartPourcentage?: number | null;

  // Production
  totalBottlesProduced: number;

  // Exports
  ngabou: number;
  exports: number;
  divers: number;

  // Audit
  createdAt: Date | string;
  updatedAt: Date | string;
  observations?: string | null;

  // Relations (optionnelles)
  startedBy?: {
    id: number;
    name: string;
    email: string;
  };
  completedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  arrets?: ProductionArret[];
  bottles?: BottleProduction[];
  reservoirs?: Reservoir[];

}

export interface DashboardKPIs {
  totalJours: number;
  rendementMoyen: number;
  productionTotale: number;
  ecartMoyen: number;
  totalArrets: number;
  dureeMoyenneArrets: number;
}

export interface DashboardData {
  period: number;
  kpis: DashboardKPIs;
  arretsByType: Record<ArretType, number>;
  productionParType: Record<BottleType, { remplissage: number; expedition: number }>;
  evolutionQuotidienne: Array<{
    date: string;
    production: number;
    rendement: number;
    ecart: number;
    nbArrets: number;
  }>;
  chartData: {
    production: Array<{ date: string; valeur: number }>;
    rendement: Array<{ date: string; valeur: number }>;
    ecarts: Array<{ date: string; valeur: number }>;
    arrets: Array<{ date: string; valeur: number }>;
  };
  lastUpdate: string;
}

export interface CreateArretData {
  type: ArretType;
  duree: number; // En minutes
  remarque?: string;
}

export interface CompleteInventoryData {
  butanier: number;
  recuperation: number;
  approSAR: number;
  ngabou: number;
  exports: number;
  divers: number;
  stockFinalPhysique: number;
  observations?: string;
  bottles: Array<{
    type: BottleType;
    quantity: number;
  }>;
  reservoirs: Array<{
    name: string;
    reservoirConfigId?: number;
    hauteur: number;
    temperature: number;
    volumeLiquide: number;
    pressionInterne: number;
    densiteA15C: number;
  }>;
}

// Constantes
export const BOTTLE_TYPES: Record<BottleType, string> = {
  B2_7: 'B2.7kg',
  B6: 'B6kg',
  B9: 'B9kg',
  B12_5: 'B12.5kg',
  B12_5K: 'B12.5kg (Kheuweul)',
  B38: 'B38kg',
  
};

export const BOTTLE_WEIGHTS: Record<BottleType, number> = {
  B2_7: 2.7,
  B6: 6,
  B9: 9,
  B12_5: 12.5,
  B38: 38,
  B12_5K: 12.5
};

export const ARRET_TYPES: Record<ArretType, string> = {
  INCIDENT_TECHNIQUE: 'Incident technique',
  PANNE: 'Panne',
  MAINTENANCE: 'Maintenance',
  AUTRE: 'Autre'
};

export const STATUS_LABELS: Record<ProductionStatus, string> = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ARCHIVE: 'Archivé'
};

export const STATUS_COLORS: Record<ProductionStatus, string> = {
  EN_COURS: 'bg-blue-100 text-blue-800',
  TERMINE: 'bg-green-100 text-green-800',
  ARCHIVE: 'bg-gray-100 text-gray-800',
};

export const SPHERE_LABELS: Record<ReservoirType, string> = {
  SPHERE: 'Sphère',
  CIGARE: 'Cigare',
  AUTRE: 'Autre',
};

// Utilitaires de calcul
export const calculateTonnage = (type: BottleType, quantity: number): number => {
  return (quantity * BOTTLE_WEIGHTS[type]) / 1000;
};

export const calculateCumulSortie = (
  bottles: { type: BottleType; quantity: number }[],
  ngabou: number,
  exports: number,
  divers: number
): number => {
  const bottlesTonnage = bottles.reduce(
    (sum, b) => sum + calculateTonnage(b.type, b.quantity),
    0
  );
  return bottlesTonnage + ngabou + exports + divers;
};

export const calculateStockFinalTheorique = (
  stockInitial: number,
  butanier: number,
  recuperation: number,
  approSAR: number,
  cumulSortie: number
): number => {
  return stockInitial + butanier + recuperation + approSAR - cumulSortie;
};

export const calculateEcart = (
  stockTheorique: number,
  stockPhysique: number
): { ecart: number; ecartPourcentage: number } => {
  const ecart = stockPhysique - stockTheorique;
  const ecartPourcentage = stockTheorique !== 0
    ? (ecart / stockTheorique) * 100
    : 0;

  return {
    ecart: parseFloat(ecart.toFixed(2)),
    ecartPourcentage: parseFloat(ecartPourcentage.toFixed(2))
  };
};

export const calculateRendement = (
  tempsUtile: number,
  tempsTotal: number
): number => {
  if (tempsTotal <= 0) return 0;
  return (tempsUtile / tempsTotal) * 100;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
};

