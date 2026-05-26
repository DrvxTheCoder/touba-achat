"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { BDS } from "../types/bds";
import { cn } from "@/lib/utils";
import { BDSStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";

interface BDSTableRowProps {
  bds: BDS;
  onClick: () => void;
  isSelected: boolean;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

const getBDSStatusColor = (status: BDSStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-500/20 text-blue-500";
    case "VALIDATED":
      return "bg-green-500/20 text-green-500";
    case "COMPLETED":
      return "bg-orange-500/20 text-orange-500";
    case "RETURNED":
      return "bg-purple-500/20 text-purple-500";
    case "REJECTED":
      return "bg-red-500/20 text-red-500";
    default:
      return "bg-gray-500/20 text-gray-500";
  }
};

const getBDSStatusLabel = (status: BDSStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "Soumis";
    case "VALIDATED":
      return "Validé";
    case "COMPLETED":
      return "Sorti";
    case "RETURNED":
      return "Retourné";
    case "REJECTED":
      return "Rejeté";
    default:
      return status;
  }
};

export function BDSTableRow({ bds, onClick, isSelected }: BDSTableRowProps) {
  const truncatedMotif = truncateText(bds.motif, 40);

  return (
    <TableRow
      className={cn("cursor-pointer hover:bg-muted/50", isSelected && "bg-muted")}
      onClick={onClick}
    >
      <TableCell className="font-medium">
        <Link href={`/bds?bdsId=${bds.bdsId}`}>
          <div className="text-[0.6rem] md:text-xs hover:underline"># {bds.bdsId}</div>
        </Link>
        <div className="hidden text-xs text-muted-foreground md:inline">{bds.creator.name}</div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{truncatedMotif || "N/A"}</TableCell>
      <TableCell className="hidden sm:table-cell">{bds.department?.name || "N/A"}</TableCell>
      <TableCell className="hidden sm:table-cell">
        {new Date(bds.date).toLocaleDateString("fr-FR")}
      </TableCell>
      <TableCell className="text-right sm:table-cell">
        <Badge
          className={`text-[0.6rem] md:text-xs w-fit text-nowrap ${getBDSStatusColor(bds.status)}`}
          variant="outline"
        >
          <small>{getBDSStatusLabel(bds.status)}</small>
        </Badge>
      </TableCell>
      <TableCell className="text-xs md:hidden sm:table-cell text-right">
        <Button variant="outline" size="icon">
          <Link href={`/bds?bdsId=${bds.bdsId}`}>
            <OpenInNewWindowIcon className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
