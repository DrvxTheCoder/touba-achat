"use client"

import { TableCell, TableRow } from "@/components/ui/table";
import { BDC } from "../types/bdc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BDCStatus } from "@prisma/client";
import { StatusBadge } from "@/app/dashboard/etats/components/StatusBadge";
import Link from "next/link";

interface BDCTableRowProps {
  bdc: BDC;
  onClick: () => void;
  isSelected: boolean;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};



const getStatusColor = (status: BDCStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30";
    case "APPROVED_RESPONSABLE":
      return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30";
    case "APPROVED_DIRECTEUR":
      return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30";
    case "APPROVED_DAF":
      return "bg-green-500/20 text-green-500 hover:bg-green-500/30";
    case "PRINTED":
      return "bg-blue-500/20 text-green-500 hover:bg-blue-500/30";
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
    case "APPROVED_DAF":
      return "Approuvé DAF";
    case "PRINTED":
      return "Décaissé";
    case "REJECTED":
      return "Rejeté";
    case "UPDATED":
      return "Mis à jour";
    default:
      return status;
  }
};

export function BDCTableRow({ bdc, onClick, isSelected }: BDCTableRowProps) {
    // console.log('BDC in row:', bdc); // For debugging

    const truncatedTitle = truncateText(bdc?.title, 40);
    
    return (
      <TableRow 
        className={cn(
          "cursor-pointer hover:bg-muted/50",
          isSelected && "bg-muted"
        )}
        onClick={onClick}
      >
        <TableCell className="font-medium">
          <Link href={`/bdc?bdcId=${bdc?.bdcId}`}><div className="text-[0.6rem] md:text-xs hover:underline"># {bdc?.bdcId}</div></Link>
          <div className="hidden text-xs text-muted-foreground md:inline">
            {bdc?.creator.name}
          </div>
        </TableCell>
        <TableCell className="sm:table-cell">
          {truncatedTitle || 'N/A'}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {bdc?.department?.name || 'N/A'}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {typeof bdc?.totalAmount === 'number' ? bdc.totalAmount.toLocaleString() : 'N/A'}
        </TableCell>
        <TableCell className="text-right sm:table-cell">
          <StatusBadge status={bdc?.status} />
        </TableCell>
      </TableRow>
    );
  }