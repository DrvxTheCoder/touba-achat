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
  | 'REJECTED'
  | 'COMPLETED';

  export type EDB = {
    id: string;
    edbId: string;
    title: string;
    description: {
      items: Array<{ designation: string; quantity: number }>;
    };
    status: EDBStatus;
    category: string;
    createdAt: string;
    updatedAt: string;
    department: string;
    creator: {
      name: string;
    };
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
    }>;
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
    | 'IT_APPROVED'
    | 'COMPLETED';