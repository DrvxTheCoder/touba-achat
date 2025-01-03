// components/stock/StockEDBTableRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StockEDBStatus } from '@prisma/client';
import { StatusBadge } from './StatusBadge';
import { BaseStockEDB } from '../types/stock-edb';


type StockEDBTableRowProps = {
  stockEdb: BaseStockEDB;
  onClick: (stockEdb: BaseStockEDB) => void;
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
        <TableCell className="text-xs md:text-base">      
          <div className="text-xs md:font-medium"># {stockEdb.edbId}</div>
          <div className="hidden text-xs text-muted-foreground md:inline">
          {getEmployeeName()}
          </div></TableCell>
        <TableCell className="text-xs md:text-base sm:table-cell">      
          <StatusBadge status={stockEdb.status} />
        </TableCell>
        <TableCell className="text-xs md:text-base hidden sm:table-cell">{stockEdb.category.name}</TableCell>
        <TableCell className="text-xs md:text-base hidden sm:table-cell">{totalItems} article(s)</TableCell>
        <TableCell className="text-xs md:text-base sm:table-cell text-right">
          {format(new Date(stockEdb.createdAt), "dd/MM/yyyy", { locale: fr })}
        </TableCell>
      </TableRow>
    );
  };