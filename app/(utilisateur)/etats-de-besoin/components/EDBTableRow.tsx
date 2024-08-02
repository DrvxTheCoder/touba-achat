// components/EDBTableRow.tsx

import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EDB, EDBStatus } from '../data/types';

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
    default:
      return <Badge variant="default" className="text-xs">{status}</Badge>;
  }
};

export const EDBTableRow: React.FC<EDBTableRowProps> = ({ edb, onClick, isSelected }) => {
  return (
    <TableRow onClick={() => onClick(edb)} className={`cursor-pointer ${isSelected ? 'bg-muted/20' : ''}`}>
      <TableCell>{edb.edbId}</TableCell>
      <TableCell className="hidden sm:table-cell">{edb.title}</TableCell>
      <TableCell className="hidden sm:table-cell">{edb.category}</TableCell>
      <TableCell className="text-xs">{getStatusBadge(edb.status)}</TableCell>
      <TableCell className="hidden sm:table-cell text-right">{edb.totalAmount.toLocaleString()} XOF</TableCell>
    </TableRow>
  );
};