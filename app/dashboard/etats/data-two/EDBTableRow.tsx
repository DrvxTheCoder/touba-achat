// EDBTableRow.tsx
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EDB } from './data';
import { MoreVertical } from 'lucide-react';

interface EDBTableRowProps {
  edb: EDB;
  onRowClick: (edb: EDB) => void;
  isSelected: boolean;
}

const statusMapping = {
  'Brouillon': ['DRAFT'],
  'Soumis': ['SUBMITTED'],
  'Validé': ['APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'IT_APPROVED', 'APPROVED_DG'],
  'En attente': ['AWAITING_MAGASINIER', 'AWAITING_SUPPLIER_CHOICE', 'AWAITING_IT_APPROVAL', 'AWAITING_FINAL_APPROVAL'],
  'En cours': ['MAGASINIER_ATTACHED', 'SUPPLIER_CHOSEN'],
  'Rejeté': ['REJECTED'],
  'Complété': ['COMPLETED']
};

const getFrenchStatus = (status: string): string => {
  for (const [frenchLabel, englishStatuses] of Object.entries(statusMapping)) {
    if (englishStatuses.includes(status)) {
      return frenchLabel;
    }
  }
  return status; // fallback to original status if not found
};

const getStatusVariant = (status: string): "destructive" | "outline" | "default" | "secondary" => {
  const frenchStatus = getFrenchStatus(status);
  switch (frenchStatus) {
    case 'Rejeté':
      return "destructive";
    case 'Validé':
      return "outline";
    case 'Complété':
      return "default";
    default:
      return "secondary";
  }
};

export const EDBTableRow: React.FC<EDBTableRowProps> = ({ edb, onRowClick, isSelected }) => {
  const frenchStatus = getFrenchStatus(edb.status);
  const statusVariant = getStatusVariant(edb.status);

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
        <Badge 
          className="text-xs" 
          variant={statusVariant}
        >
          <small>{frenchStatus}</small>
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{edb.department}</TableCell>
      <TableCell className="text-right">{edb.amount.toLocaleString('fr-FR')} XOF</TableCell>
      <TableCell className="lg:hidden">
        <MoreVertical className="w-4 h-4" />
      </TableCell>
    </TableRow>
  );
};