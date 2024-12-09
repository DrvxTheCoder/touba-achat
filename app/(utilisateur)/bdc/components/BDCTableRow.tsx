"use client"

import { TableCell, TableRow } from "@/components/ui/table";
import { BDC } from "../types/bdc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BDCStatus } from "@prisma/client";

interface BDCTableRowProps {
  bdc: BDC;
  onClick: () => void;
  isSelected: boolean;
}

const getStatusColor = (status: BDCStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30";
    case "APPROVED_RESPONSABLE":
      return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30";
    case "APPROVED_DIRECTEUR":
      return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30";
    case "PRINTED":
      return "bg-green-500/20 text-green-500 hover:bg-green-500/30";
    case "REJECTED":
      return "bg-red-500/20 text-red-500 hover:bg-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
  }
};

const getStatusLabel = (status: BDCStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "Soumis";
    case "APPROVED_RESPONSABLE":
      return "En cours";
    case "APPROVED_DIRECTEUR":
      return "Approuvé";
    case "PRINTED":
      return "Imprimé";
    case "REJECTED":
      return "Rejeté";
    case "UPDATED":
      return "Mis à jour";
    default:
      return status;
  }
};

export function BDCTableRow({ bdc, onClick, isSelected }: BDCTableRowProps) {
    console.log('BDC in row:', bdc); // For debugging
    
    return (
      <TableRow 
        className={cn(
          "cursor-pointer hover:bg-muted/50",
          isSelected && "bg-muted"
        )}
        onClick={onClick}
      >
        <TableCell className="font-medium">
          {bdc?.bdcId || 'N/A'}
        </TableCell>
        <TableCell className="sm:table-cell">
          {bdc?.title || 'N/A'}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {bdc?.department?.name || 'N/A'}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {typeof bdc?.totalAmount === 'number' ? bdc.totalAmount.toLocaleString() : 'N/A'}
        </TableCell>
        <TableCell className="text-right sm:table-cell">
          <Badge variant="outline" className={getStatusColor(bdc?.status)}>
            {getStatusLabel(bdc?.status)}
          </Badge>
        </TableCell>
      </TableRow>
    );
  }