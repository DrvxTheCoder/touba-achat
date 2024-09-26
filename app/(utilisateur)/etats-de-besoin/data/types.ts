// types.ts
export type EDBStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED_RESPONSABLE'
  | 'APPROVED_DIRECTEUR'
  | 'ESCALATED'
  | 'AWAITING_MAGASINIER'
  | 'MAGASINIER_ATTACHED'
  | 'AWAITING_SUPPLIER_CHOICE'
  | 'SUPPLIER_CHOSEN'
  | 'AWAITING_IT_APPROVAL'
  | 'IT_APPROVED'
  | 'AWAITING_FINAL_APPROVAL'
  | 'APPROVED_DG'
  | 'FINAL_APPROVAL'
  | 'ESCALATED'
  | 'REJECTED'
  | 'COMPLETED';

  export type EDB = {
    items: any;
    id: string;
    edbId: string;
    title: string;
    description: {
      items: Array<{ designation: string; quantity: number }>;
    };
    status: EDBStatus;
    category: string;
    date: any;
    updatedAt: string;
    department: string;
    employee: {
      name: string;
      department: string;
      email: string;
    };
    email: string;
    totalAmount: number;
    auditLogs: Array<{
      id: number;
      eventType: EDBEventType;
      eventAt: string;
      user: {
        name: string;
      };
    }>;
    attachments: Array<{
      id: number;
      fileName: string;
      filePath: string;
      supplierName: string;
      totalAmount: number;
    }>;
    finalSupplier: FinalSupplier | null;
    rejectionReason: string | undefined;
  };

  export type EDBEventType = 
    | 'DRAFT_CREATED'
    | 'SUBMITTED'
    | 'APPROVED_RESPONSABLE'
    | 'APPROVED_DIRECTEUR'
    | 'APPROVED_DG'
    | 'REJECTED'
    | 'UPDATED'
    | 'ATTACHMENT_ADDED'
    | 'ATTACHMENT_REMOVED'
    | 'ESCALATED'
    | 'MAGASINIER_ATTACHED'
    | 'SUPPLIER_CHOSEN'
    | 'AWAITING_FINAL_APPROVAL'
    | 'FINAL_APPROVAL'
    | 'COMPLETED';

    export type Attachment = {
      id: number;
      fileName: string;
      filePath: string;
      supplierName: string;
      totalAmount?: number; // Make this optional
    };

export type FinalSupplier = {
  id: number;
  filePath: string;
  supplierName: string;
  amount: number;
  chosenAt: string;
  chosenBy: number;
};