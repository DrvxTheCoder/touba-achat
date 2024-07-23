// EDBTableRow.tsx
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EDB } from './data';
import { MoreVertical } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

interface EDBTableRowProps {
  edb: EDB;
  onRowClick: (edb: EDB) => void;
  isSelected: boolean;
}

export const EDBTableRow: React.FC<EDBTableRowProps> = ({ edb, onRowClick, isSelected }) => {


  return (
    <TableRow 
      onClick={() => onRowClick(edb)} 
      className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}
    >
      <TableCell>
        <div className="font-medium"># {edb.id}</div>
        <div className="hidden text-xs text-muted-foreground md:inline">
          {edb.email}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{edb.category}</TableCell>
      <TableCell className="hidden sm:table-cell">
        <StatusBadge status={edb.status} textSize={"tiny"} />
      </TableCell>
      <TableCell className="hidden md:table-cell">{edb.department}</TableCell>
      <TableCell className="text-right">{edb.amount.toLocaleString('fr-FR')} XOF</TableCell>
      <TableCell className="lg:hidden">
        <MoreVertical className="w-4 h-4" />
      </TableCell>
    </TableRow>
  );
};