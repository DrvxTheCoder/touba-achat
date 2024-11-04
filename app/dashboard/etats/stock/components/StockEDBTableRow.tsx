// components/stock/StockEDBTableRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StockEDBStatus } from '@prisma/client';

interface StockEDBRow {
  id: number;
  edbId: string;
  description: {
    items: Array<{ name: string; quantity: number }>;
    comment?: string;
  };
  category: {
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  employee?: {
    name: string;
    id?: number;
  } | null;
  externalEmployeeName?: string | null;
  createdAt: Date | string;
  status: StockEDBStatus;
  convertedEdb?: {
    description: {
      items: Array<{ designation: string; quantity: number }>;
    };
  } | null;
}

type StockEDBTableRowProps = {
  stockEdb: StockEDBRow;
  onClick: (stockEdb: StockEDBRow) => void;
  isSelected: boolean;
};

export const StockEDBTableRow: React.FC<StockEDBTableRowProps> = ({ 
    stockEdb, 
    onClick, 
    isSelected 
  }) => {
    // Updated employee name handling
    const getEmployeeName = () => {
      if (stockEdb.employee?.name) return stockEdb.employee.name;
      if (stockEdb.externalEmployeeName) return stockEdb.externalEmployeeName;
      if (!stockEdb.employee && !stockEdb.externalEmployeeName) return 'N/A';
      return 'N/A';
    };
    
    // Handle both original and converted items
    const getItems = () => {
      if (stockEdb.status === 'CONVERTED' && stockEdb.convertedEdb?.description?.items) {
        return stockEdb.convertedEdb.description.items;
      }
      return stockEdb.description.items;
    };

    const totalItems = getItems().reduce((sum, item) => sum + item.quantity, 0);
  
    return (
      <TableRow 
        onClick={() => onClick(stockEdb)} 
        className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}
      >
        <TableCell>{stockEdb.edbId}</TableCell>
        <TableCell className="hidden sm:table-cell">{getEmployeeName()}</TableCell>
        <TableCell className="hidden sm:table-cell">{stockEdb.category.name}</TableCell>
        <TableCell className="hidden sm:table-cell">{totalItems} article(s)</TableCell>
        <TableCell className="hidden sm:table-cell text-right">
          {format(new Date(stockEdb.createdAt), "dd/MM/yyyy", { locale: fr })}
        </TableCell>
      </TableRow>
    );
  };