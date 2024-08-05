import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { EDBStatus, EDB } from '@/app/(utilisateur)/etats-de-besoin/data/types';
import { MoreVertical } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';


interface EDBTableRowProps {
  edb: EDB;
  onRowClick: (edb:EDB) => void;
  isSelected: boolean;
}

export const EDBTableRow: React.FC<EDBTableRowProps> = ({ edb, onRowClick, isSelected }) => {
  const displayId = edb.edbId || edb.id;
  const displayEmail = edb.employee?.email || edb.email || 'N/A';
  const displayAmount = (edb.finalSupplier?.amount || 0).toLocaleString('fr-FR');

  return (
    <TableRow 
      onClick={() => onRowClick(edb)} 
      className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}
    >
      <TableCell>
        <div className="font-medium"># {displayId}</div>
        <div className="hidden text-xs text-muted-foreground md:inline">
          {displayEmail}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{edb.category}</TableCell>
      <TableCell className="hidden sm:table-cell">
        <StatusBadge status={edb.status as EDBStatus} textSize="tiny" />
      </TableCell>
      <TableCell className="hidden md:table-cell">{edb.department}</TableCell>
      <TableCell className="text-right">
        {displayAmount} XOF
      </TableCell>
      <TableCell className="lg:hidden">
        <MoreVertical className="w-4 h-4" />
      </TableCell>
    </TableRow>
  );
};





