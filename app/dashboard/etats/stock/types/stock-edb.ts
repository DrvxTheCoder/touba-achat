// types/stock-edb.ts
import { StockEDBStatus, EDBStatus } from '@prisma/client';

export interface BaseStockEDB {
  id: number;
  edbId: string;
  status: StockEDBStatus;
  description: {
    items: Array<{ name: string; quantity: number }>;
    comment?: string;
  };
  category: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  employee?: {
    id?: number;
    name: string;
  } | null;
  externalEmployeeName?: string | null;
  createdAt: Date | string;
  convertedAt?: Date | string;
  convertedBy?: {
    id: number;
    name: string;
  } | null;
  deliveryHistory?: Array<{
    items: Array<{ name: string; quantity: number }>;
    deliveredAt: string;
    deliveredBy: number;
  }>;
  convertedEdb?: {
    id: number;
    edbId: string;
    status: EDBStatus | string;
    description?: {
      items: Array<{ designation: string; quantity: number }>;
    };
    auditLogs: Array<{
      id: number;
      eventType: string;
      eventAt: string;
      user: {
        name: string;
      };
    }>;
  } | null;
}

// For components that need stricter typing
export interface StockEDB extends BaseStockEDB {
  category: {
    id: number;
    name: string;
  };
  createdAt: Date;
  convertedAt?: Date;
}

// For components that need more flexible typing (like the Details card)
export interface StockDetails extends BaseStockEDB {
  category: {
    name: string;
    id: number;
  };
  createdAt: Date | string;
  convertedAt?: Date | string;
}