// app/(utilisateur)/bdc/types/bdc.ts

import { BDCStatus } from "@prisma/client";

export type ExpenseItem = {
  item: string;
  amount: number;
};

export type EmployeeInfo = {
  name: string;
  role: string;
};

export type BDC = {
  id: number;
  bdcId: string;
  title: string;
  description: ExpenseItem[];
  employees: EmployeeInfo[];
  comment?: string | null;
  totalAmount: number;
  status: BDCStatus;
  createdAt: string;
  updatedAt: string;
  departmentId: number;
  department: {
    id: number;
    name: string;
  };
  creator: {
    id: number;
    name: string;
    email: string;
  };
  userCreator: {
    id: number;
    name: string;
    email: string;
  };
  approver?: {
    id: number;
    name: string;
    email: string;
  } | null;
  rejector?: {
    id: number;
    name: string;
    email: string;
  } | null;
  approverDAF?: {
    id: number;
    name: string;
    email: string;
  } | null;
  printedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  printedAt?: string | null;
  rejectionReason?: string | null;
  auditLogs?: Array<{
    id: number;
    eventType: string;
    eventAt: string;
    user: {
      id: number;
      name: string;
    };
    details?: any;
  }>;
};