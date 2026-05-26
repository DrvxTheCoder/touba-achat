import { BDSStatus, BDSType } from "@prisma/client";

export type BDSItem = {
  quantite: number;
  designation: string;
  observations?: string;
};

export type ReturnItem = {
  designation: string;
  quantiteRetournee: number;
};

export type ReturnHistoryEntry = {
  items: ReturnItem[];
  returnedAt: string;
  returnedById: number;
  heureRetour?: string;
};

export type EmployeeInfo = {
  name: string;
  role: string;
};

export type BDS = {
  id: number;
  bdsId: string;
  type: BDSType;
  motif: string;
  destination?: string | null;
  date: string;
  heureSortie?: string | null;
  heureRetour?: string | null;
  heureSortieEffective?: string | null;
  heureRetourEffective?: string | null;
  comment?: string | null;
  employees?: EmployeeInfo[] | null;
  vehicule?: string | null;
  chauffeur?: string | null;
  items?: BDSItem[] | null;
  nombreColis?: number | null;
  isReturnable: boolean;
  status: BDSStatus;
  createdAt: string;
  updatedAt: string;
  departmentId: number;
  department: { id: number; name: string };
  creator: { id: number; name: string; email: string };
  userCreator: { id: number; name: string; email: string };
  validator?: { id: number; name: string; email: string } | null;
  rejector?: { id: number; name: string; email: string } | null;
  completedBy?: { id: number; name: string; email: string } | null;
  returnedBy?: { id: number; name: string; email: string } | null;
  completedAt?: string | null;
  returnedAt?: string | null;
  rejectionReason?: string | null;
  returnHistory?: ReturnHistoryEntry[] | null;
  isFullyReturned?: boolean;
  auditLogs?: Array<{
    id: number;
    eventType: string;
    eventAt: string;
    user: { id: number; name: string };
    details?: any;
  }>;
};
