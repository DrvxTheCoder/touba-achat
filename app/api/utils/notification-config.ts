// types/notification-config.ts

export type Department = 'dg' | 'daf' | 'dog' | 'drh' | 'dcm';

// Define event types
export type EDBEvent = 
  | 'submitted'
  | 'approved'
  | 'magasinier_attached'
  | 'awaiting_supplier_choice'
  | 'awaiting_final_approval'
  | 'delivered';

export type ODMEvent = 
  | 'submitted'
  | 'approved'
  | 'approved_by_drh'
  | 'processed_by_drh';

export type BDCEvent = 
  | 'submitted'
  | 'approved'
  | 'approved_by_daf';

export type StockEDBEvent = 'submitted';

// Create record types for each entity
export type EDBNotificationMap = {
  [K in `${EDBEvent}_${Department}`]: string[];
} & {
  awaiting_supplier_choice: string[];
  awaiting_supplier_choice_it: string[];
  awaiting_final_approval: string[];
};

export type ODMNotificationMap = {
  [K in `${ODMEvent}_${Department}`]: string[];
};

export type BDCNotificationMap = {
  [K in `${BDCEvent}_${Department}`]: string[];
};

export type StockEDBNotificationMap = {
  [K in StockEDBEvent]: string[];
};

// Main notification map type
export type NotificationMap = {
  edb: Partial<EDBNotificationMap>;
  odm: Partial<ODMNotificationMap>;
  bdc: Partial<BDCNotificationMap>;
  "stock-edb": StockEDBNotificationMap;
};