import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EDBTimelineDialog } from "@/components/EDBTimelineDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StockEDBStatus } from "@prisma/client";
import { StatusBadge } from '@/app/dashboard/etats/components/StatusBadge';
import { StockEDB } from '@/app/dashboard/etats/stock/types/stock-edb';
import { Badge } from '@/components/ui/badge';
import { EDBEventType, EDBStatus } from '@/app/(utilisateur)/etats-de-besoin/data/types';

interface UserStockEDBDetailsProps {
  stockEdb: StockEDB;
}

// Helper function to convert Prisma EDB data to Timeline format
const convertToTimelineFormat = (convertedEdb: any) => {
  if (!convertedEdb) return null;

  return {
    id: convertedEdb.id.toString(),
    edbId: convertedEdb.edbId,
    status: convertedEdb.status as EDBStatus,
    auditLogs: convertedEdb.auditLogs.map((log: any) => ({
      id: log.id,
      eventType: log.eventType as EDBEventType,
      eventAt: typeof log.eventAt === 'string' 
        ? log.eventAt 
        : log.eventAt.toISOString(),
      user: {
        name: log.user.name
      }
    }))
  };
};

export function UserStockEDBDetails({ stockEdb }: UserStockEDBDetailsProps) {
  const isConverted = stockEdb.status === StockEDBStatus.CONVERTED;

  return (
    <Card>
      <CardHeader className="space-y-1 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">#{stockEdb.edbId}</CardTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={stockEdb.status} />
            
            {isConverted && stockEdb.convertedEdb && (
              <EDBTimelineDialog 
                edb={convertToTimelineFormat(stockEdb.convertedEdb)!}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div>
          <h3 className="font-semibold mb-2">Informations</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Catégorie:</div>
            <div>{stockEdb.category.name}</div>
            <div className="text-muted-foreground">Soumis le:</div>
            <div>{format(new Date(stockEdb.createdAt), "Pp", { locale: fr })}</div>
            {isConverted && stockEdb.convertedAt && (
              <>
                <div className="text-muted-foreground">Converti le:</div>
                <div>{format(new Date(stockEdb.convertedAt), "Pp", { locale: fr })}</div>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Articles</h3>
          <ScrollArea className="h-[200px] rounded-md border border-dashed p-4">
            <div className="space-y-2">
              {stockEdb.description.items.map((item: any, index: any) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <Badge variant="secondary">x {item.quantity}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {stockEdb.description.comment && (
          <div>
            <h3 className="font-semibold mb-2">Commentaire</h3>
            <p className="text-sm text-muted-foreground">
              {stockEdb.description.comment}
            </p>
          </div>
        )}
      </CardContent>
      
      {isConverted && stockEdb.convertedEdb && (
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <div className="text-xs text-muted-foreground flex items-center justify-between w-full">
            <span>EDB Standard: #{stockEdb.convertedEdb.edbId}</span>
            <StatusBadge status={stockEdb.convertedEdb.status} />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}