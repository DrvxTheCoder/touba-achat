import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  employee?: {
    name: string;
  } | null;
  externalEmployeeName?: string | null;
  createdAt: Date;
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
    console.log("StockEDBTableRow received:", stockEdb); // Add this log
    
    const employeeName = stockEdb.employee?.name || stockEdb.externalEmployeeName || 'N/A';
    const totalItems = stockEdb.description.items.reduce((sum, item) => sum + item.quantity, 0);
  
    return (
      <TableRow 
        onClick={() => onClick(stockEdb)} 
        className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}
      >
        <TableCell>{stockEdb.edbId}</TableCell>
        <TableCell className="hidden sm:table-cell">{employeeName}</TableCell>
        <TableCell className="hidden sm:table-cell">{stockEdb.category.name}</TableCell>
        <TableCell className="hidden sm:table-cell">{totalItems} article(s)</TableCell>
        <TableCell className="hidden sm:table-cell text-right">
          {format(new Date(stockEdb.createdAt), "dd/MM/yyyy", { locale: fr })}
        </TableCell>
      </TableRow>
    );
  };