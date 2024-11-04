// types/stock-edb.ts

import { StockEDBStatus, EDBStatus } from '@prisma/client';

export interface StockEDB {
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
  createdAt: Date;
  convertedAt?: Date;
  convertedBy?: {
    id: number;
    name: string;
  } | null;
  convertedEdb?: {
    id: number;
    edbId: string;
    status: EDBStatus;
    description: {
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