// components/stock/StockEDBTableRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StockEDBStatus } from '@prisma/client';
import { StatusBadge } from './StatusBadge';
import { BaseStockEDB } from '../types/stock-edb';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OpenInNewWindowIcon } from '@radix-ui/react-icons';
import { Checkbox } from '@/components/ui/checkbox';


type StockEDBTableRowProps = {
  stockEdb: BaseStockEDB;
  onClick: (stockEdb: BaseStockEDB) => void;
  isSelected: boolean;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showCheckbox: boolean;
};

export const StockEDBTableRow: React.FC<StockEDBTableRowProps> = ({
    stockEdb,
    onClick,
    isSelected,
    isChecked,
    onCheckedChange,
    showCheckbox,
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
        className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''} ${isChecked ? 'bg-primary/5' : ''}`}
      >
        {showCheckbox && (
          <TableCell className="w-8 pr-0">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Sélectionner ${stockEdb.edbId}`}
            />
          </TableCell>
        )}
        <TableCell className="text-xs md:text-base">
          <div className="text-[0.6rem] md:text-xs"># {stockEdb.edbId}</div>
          <div className="hidden text-xs text-muted-foreground md:inline">
          {getEmployeeName()}
          </div></TableCell>
        <TableCell className="text-xs md:text-base sm:table-cell">
          <StatusBadge status={stockEdb.status} />
        </TableCell>
        <TableCell className="text-xs md:text-sm hidden sm:table-cell">{stockEdb.category.name}</TableCell>
        <TableCell className="text-xs md:text-sm hidden sm:table-cell">{totalItems} article(s)</TableCell>
        <TableCell className="text-xs md:text-sm hidden sm:table-cell">
          {format(new Date(stockEdb.createdAt), "dd/MM/yyyy", { locale: fr })}
        </TableCell>
        <TableCell className="text-xs md:hidden sm:table-cell text-right">
          <Button variant={'outline'} size={'icon'}><Link href={`/dashboard/etats/stock?edbId=${stockEdb.edbId}`}><OpenInNewWindowIcon className='h-4 w-4'/></Link></Button>
        </TableCell>
      </TableRow>
    );
  };
