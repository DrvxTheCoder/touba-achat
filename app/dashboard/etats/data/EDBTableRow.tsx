import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { EDBStatus, EDB } from '@/app/(utilisateur)/etats-de-besoin/data/types';
import { MoreVertical } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { OpenInNewWindowIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


interface EDBTableRowProps {
  edb: EDB;
  onRowClick: (edb:EDB) => void;
  isSelected: boolean;
}

export const EDBTableRow: React.FC<EDBTableRowProps> = ({ edb, onRowClick, isSelected }) => {
  const displayId = edb.edbId || edb.id;
  const displayEmail = edb.employee?.email || edb.email || 'N/A';
  const displayName = edb.employee?.name || edb.creator?.name || 'N/A';
  const displayAmount = (edb.finalSupplier?.amount || 0).toLocaleString('fr-FR');

  return (
    <TableRow 
      onClick={() => onRowClick(edb)} 
      className={`rounded-lg cursor-pointer hover:bg-muted/60 ${isSelected ? 'bg-muted/60' : ''}`}
    >
      <TableCell className='rounded-l-lg'>
        <Link href={`/dashboard/etats/${displayId}`}><div className="text-[0.6rem] md:text-xs hover:underline"># {displayId}</div></Link>
        <div className="hidden text-xs text-muted-foreground md:inline">
          {displayName}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{edb.category}</TableCell>
      <TableCell className="text-left ">
        <StatusBadge status={edb.status as EDBStatus} />
      </TableCell>
      <TableCell className="hidden md:table-cell">{edb.department}</TableCell>
      <TableCell className="hidden sm:table-cell">
        {displayAmount} XOF
      </TableCell>
      <TableCell className="lg:hidden">
        <Link href={`/dashboard/etats/${displayId}`}>
          <Button size="icon" variant="outline">
            <OpenInNewWindowIcon className="w-4 h-4" />
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
};





