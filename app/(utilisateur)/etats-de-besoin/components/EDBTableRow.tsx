// components/EDBTableRow.tsx

import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EDB, EDBStatus } from '../data/types';
import { StatusBadge } from '@/app/dashboard/etats/components/StatusBadge';

type EDBTableRowProps = {
  edb: EDB;
  onClick: (edb: EDB) => void;
  isSelected: boolean;
};


const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary" className="text-xs">Brouillon</Badge>;
    case 'SUBMITTED':
      return <Badge variant="outline" className="text-xs"><small>Soumis</small></Badge>;
    case 'APPROVED_RESPONSABLE':
      return <Badge variant="secondary" className="text-xs">Approuvé (Resp.)</Badge>;
    case 'APPROVED_DIRECTEUR':
    case 'APPROVED_DG':
      return <Badge variant="secondary" className="text-xs"><small>Approuvé</small></Badge>;
    case 'REJECTED':
      return <Badge variant="destructive" className="text-xs">Rejeté</Badge>;
    case 'MAGASINIER_ATTACHED':
      return <Badge variant="outline" className="text-xs"><small>Traité</small></Badge>;
    case 'SUPPLIER_CHOSEN':
      return <Badge variant="outline" className="text-xs"><small>Fournisseur Choisi</small></Badge>;
    default:
      return <Badge variant="default" className="text-xs">{status}</Badge>;
  }
};

export const EDBTableRow: React.FC<EDBTableRowProps> = ({ edb, onClick, isSelected }) => {
  const displayAmount = (edb.finalSupplier?.amount || 0).toLocaleString('fr-FR');
  return (
    <TableRow onClick={() => onClick(edb)} className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}>
      <TableCell>
        <div className="text-[0.5rem] md:text-xs"># {edb.edbId}</div>
        <div className="hidden text-xs text-muted-foreground md:inline">
          {edb.creator.name}
        </div>
      </TableCell>
      {/* <TableCell className="hidden sm:table-cell">{edb.title}</TableCell> */}
      <TableCell className="hidden sm:table-cell">{edb.category}</TableCell>
      <TableCell className="text-xs"><StatusBadge 
                        status={edb.status} 
                        rejectionReason={edb.rejectionReason}
                      /></TableCell>
      <TableCell className="hidden sm:table-cell text-right">{displayAmount} XOF</TableCell>
    </TableRow>
  );
};