// components/stock/StockEDBDetails.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EDBTimelineDialog } from "@/components/EDBTimelineDialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Role, StockEDBStatus } from "@prisma/client";
import { 
  MoreVertical, 
  PackageCheck, 
  PackageSearch, 
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from '@/app/dashboard/etats/components/StatusBadge';
import { ActionConfirmationDialog } from "./ConfirmationDialog";
import { StockEDB } from '../types/stock-edb';
import { Badge } from '@/components/ui/badge';
import { EDBEventType, EDBStatus } from '@/app/(utilisateur)/etats-de-besoin/data/types';
import Link from 'next/link';
import { PartialDeliveryDialog } from './PartialDeliveryDialog';
import { Separator } from '@/components/ui/separator';
import StockEDBPDFDialog from './StockEDBSummaryDialog';
import { StockDetails } from '@/app/dashboard/etats/stock/types/stock-edb';

interface StockEDBDetailsProps {
  stockEdb: StockDetails;
  onUpdate?: () => void;
}

// Helper function to convert Prisma EDB data to Timeline format
const convertToTimelineFormat = (convertedEdb: any) => {
  if (!convertedEdb) return null;

  return {
    id: convertedEdb.id.toString(), // Convert to string as expected by the timeline
    edbId: convertedEdb.edbId,
    status: convertedEdb.status as EDBStatus, // Use the EDBStatus type from your types file
    auditLogs: convertedEdb.auditLogs.map((log: any) => ({
      id: log.id,
      eventType: log.eventType as EDBEventType, // Use the EDBEventType from your types file
      eventAt: typeof log.eventAt === 'string' 
        ? log.eventAt 
        : log.eventAt.toISOString(), // Ensure date is in string format
      user: {
        name: log.user.name
      }
    }))
  };
};

export function StockEDBDetails({ stockEdb, onUpdate }: StockEDBDetailsProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);

  const canPerformActions = session?.user?.role && ['ADMIN', 'MAGASINIER'].includes(session.user.role);
  const isConverted = stockEdb.status === StockEDBStatus.CONVERTED;
  const isDelivered = stockEdb.status === StockEDBStatus.DELIVERED;
  const [isPartialDeliveryDialogOpen, setIsPartialDeliveryDialogOpen] = useState(false);

  const totalDelivered = (stockEdb.deliveryHistory || []).reduce((acc, delivery) => {
    delivery.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const hasDeliveries = Object.keys(totalDelivered).length > 0;

  const handleMarkAsDelivered = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/edb/stock/${stockEdb.id}/deliver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockEdbId: stockEdb.id,
          status: 'DELIVERED'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Une erreur est survenue');
      }

      toast.success('EDB Stock mis à jour', {
        description: `L'EDB #${stockEdb.edbId} a été marqué comme livré.`,
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
      setIsDeliveryDialogOpen(false);
    }
  };

  const handleConvertToStandard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/edb/stock/${stockEdb.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockEdbId: stockEdb.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Une erreur est survenue');
      }

      toast.success('EDB Stock converti', {
        description: `L'EDB #${stockEdb.edbId} a été converti en EDB standard.`,
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
      setIsConversionDialogOpen(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">#{stockEdb.edbId}</CardTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={stockEdb.status} />

            <StockEDBPDFDialog stockEdb={stockEdb} />
            
            {isConverted && stockEdb.convertedEdb && (
              <EDBTimelineDialog 
                edb={convertToTimelineFormat(stockEdb.convertedEdb)!}
              />
            )}

            {canPerformActions && !isConverted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsPartialDeliveryDialogOpen(true)}
                    disabled={stockEdb.status === "DELIVERED" || isConverted || isLoading}
                  >
                    <PackageSearch className="mr-2 h-4 w-4" />
                    Marquer comme livré (reste manquant)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeliveryDialogOpen(true)}
                    disabled={isDelivered || isLoading}
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Marquer comme livré
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsConversionDialogOpen(true)}
                    disabled={stockEdb.status !== 'SUBMITTED' || !stockEdb.employee?.id}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Convertir en EDB standard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div>
          <h3 className="font-semibold mb-2">Informations générales</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Employé:</div>
            <div>{stockEdb.employee?.name || stockEdb.externalEmployeeName || 'N/A'} {!stockEdb.employee?.id && ("- (Non-enregistré)")}</div>
            <div className="text-muted-foreground">Département:</div>
            <div>{stockEdb.department.name}</div>
            <div className="text-muted-foreground">Catégorie:</div>
            <div>{stockEdb.category.name}</div>
            <div className="text-muted-foreground">Date:</div>
            <div>{format(new Date(stockEdb.createdAt), "Pp", { locale: fr })}</div>
            {isConverted && stockEdb.convertedAt && (
              <>
                <div className="text-muted-foreground">Converti le:</div>
                <div>{format(new Date(stockEdb.convertedAt), "Pp", { locale: fr })}</div>
                <div className="text-muted-foreground">Converti par:</div>
                <div>{stockEdb.convertedBy?.name || 'N/A'}</div>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Articles</h3>
          <ScrollArea className="h-[200px] rounded-md border border-dashed p-4 flex flex-col">
            <div className="space-y-2">
              {stockEdb.description.items.map((item: any, index: any) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <Badge variant="secondary">x {item.quantity}</Badge>
                </div>
              ))}
            </div>
            {hasDeliveries && (
              <div className="mt-4">
                <h3 className="mb-2 text-muted-foreground">Historique (Livraison)</h3>
                <ScrollArea className="h-[200px] rounded-md border border-dashed p-4">
                  <div className="space-y-4">
                    {stockEdb.deliveryHistory?.map((delivery, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(delivery.deliveredAt), "Pp", { locale: fr })}
                          </span>
                        </div>
                        <div className="pl-4 space-y-1">
                          {delivery.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between items-center text-sm">
                              <span>{item.name}</span>
                              <Badge variant="secondary">
                                {item.quantity} livré{item.quantity > 1 ? 's' : ''}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {index < (stockEdb.deliveryHistory?.length || 0) - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
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
        <CardFooter className="border-t bg-muted/50 px-6 py-3 rounded-bl-2xl rounded-br-2xl">
          <div className="text-xs text-muted-foreground flex items-center justify-between w-full">
            <span className="hover:underline"><Link href={`/dashboard/etats/${stockEdb.convertedEdb.edbId}`}>#{stockEdb.convertedEdb.edbId} {"(Standard)"}</Link></span>
            <StatusBadge status={stockEdb.convertedEdb.status} />
          </div>
        </CardFooter>
      )}

      <ActionConfirmationDialog
        isOpen={isDeliveryDialogOpen}
        onClose={() => setIsDeliveryDialogOpen(false)}
        onConfirm={handleMarkAsDelivered}
        title="Confirmer la livraison"
        description="Êtes-vous sûr de vouloir marquer l'EDB #{edbId} comme livré ?"
        isLoading={isLoading}
        edbId={stockEdb.edbId}
      />

      <ActionConfirmationDialog
        isOpen={isConversionDialogOpen}
        onClose={() => setIsConversionDialogOpen(false)}
        onConfirm={handleConvertToStandard}
        title="Confirmer la conversion"
        description="Êtes-vous sûr de vouloir convertir l'EDB #{edbId} en EDB standard ? Cette action est irréversible."
        isLoading={isLoading}
        edbId={stockEdb.edbId}
      />

      <PartialDeliveryDialog
        isOpen={isPartialDeliveryDialogOpen}
        onClose={() => setIsPartialDeliveryDialogOpen(false)}
        id={stockEdb.id}
        stockEdbId={stockEdb.edbId.toString()}
        description={stockEdb.description}
        deliveryHistory={stockEdb.deliveryHistory || []}
        onSuccess={() => {
          if (onUpdate) onUpdate();
          setIsPartialDeliveryDialogOpen(false);
        }}
      />
    </Card>
  );
}