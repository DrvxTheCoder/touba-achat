// types/stock-edb.ts
import { EDBStatus, StockEDBStatus } from "@prisma/client";

export type StockEDB = {
    id: number;
    edbId: string;
    description: {
      items: Array<{
        name: string;
        quantity: number;
      }>;
      comment: string;
    };
    status: 'DRAFT' | 'CONVERTED' | 'ORDERED' | 'DELIVERED';
    department: {
      id: number;
      name: string;
    };
    category: {
      id: number;
      name: string;
      type: 'DEFAULT' | 'CUSTOM';
    };
    employee: {
      id: number;
      name: string;
      email: string;
      matriculation: string;
    };
    convertedEdb?: {
      id: number;
      edbId: string;
      status: string;
      auditLogs: Array<{
        id: number;
        eventType: string;
        eventAt: string;
        user: {
          name: string;
        };
      }>;
    } | null;
  };