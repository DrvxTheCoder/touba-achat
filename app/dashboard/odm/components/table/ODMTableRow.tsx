// odm/components/table/ODMTableRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/app/dashboard/etats/components/StatusBadge';

interface ODMTableRowProps {
  odm: {
    odmId: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
    totalCost?: number;
    creator: {
        name: string,
        email: string,
    }
  };
}

export const ODMTableRow: React.FC<ODMTableRowProps> = ({ odm }) => {

    const router = useRouter();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };



    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
      };

    const dateRange = `${formatDate(odm.startDate)} au ${formatDate(odm.endDate)}`;
    const truncatedTitle = truncateText(odm.title, 40);

  return (
    <TableRow >
      <TableCell>
        <div className="hidden text-xs text-muted-foreground md:inline">
          {odm.creator?.name}
        </div>
        <div>
          <Link className="text-[0.6rem] md:text-xs md:font-medium hover:underline" href={`/dashboard/odm/${odm.odmId}`}>
          #{odm.odmId}
          </Link>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{truncatedTitle}</TableCell>
      <TableCell className="text-right md:text-left">
        <StatusBadge status={odm.status} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {dateRange}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {odm.totalCost ? `${odm.totalCost} XOF` : 'N/A'}
      </TableCell>
      <TableCell className="lg:hidden">
        <Link href={`/dashboard/odm/${odm.odmId}`}>
            <OpenInNewWindowIcon className="w-4 h-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
};