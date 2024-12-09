// components/StockEDBTableRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from '@/app/dashboard/etats/components/StatusBadge';

// Define the type for stock EDB based on the API response
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
  employee?: {
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

type StockEDBTableRowProps = {
  edb: StockEDB;
  onClick: (edb: StockEDB) => void;
  isSelected: boolean;
};

const getStockStatusBadge = (status: string, convertedStatus?: string) => {
  if (status === 'CONVERTED' && convertedStatus) {
    switch (convertedStatus) {
      case 'APPROVED_RESPONSABLE':
      case 'APPROVED_DIRECTEUR':
        return <Badge variant="secondary" className="text-xs">Approuvé</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">Rejeté</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Converti</Badge>;
    }
  }

  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary" className="text-xs">Brouillon</Badge>;
    case 'ORDERED':
      return <Badge variant="outline" className="text-xs">Commandé</Badge>;
    case 'DELIVERED':
      return <Badge variant="secondary" className="text-xs">Livré</Badge>;
    default:
      return <Badge variant="default" className="text-xs">{status}</Badge>;
  }
};

export const StockEDBTableRow: React.FC<StockEDBTableRowProps> = ({ edb, onClick, isSelected }) => {
  // Get the latest audit log if available
  const convertedStatus = edb.convertedEdb?.status;
  const items = edb.description.items;
  const itemsSummary = items.map(item => `${item.quantity} ${item.name}`).join(', ');

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  };

  return (
    <TableRow 
      onClick={() => onClick(edb)} 
      className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}
    >
      <TableCell>
      <div className="text-xs md:font-medium"># {edb.edbId}</div>
      <div className="hidden text-xs text-muted-foreground md:inline">
          {edb.employee?.name}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{edb.category.name}</TableCell>
      <TableCell className="text-xs">
        <StatusBadge status={edb.status} />
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right">
        <span className="text-xs text-muted-foreground">{truncateText(itemsSummary, 25)}</span>
      </TableCell>
    </TableRow>
  );
};