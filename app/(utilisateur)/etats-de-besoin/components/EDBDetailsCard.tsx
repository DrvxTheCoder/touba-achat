// components/EDBDetailsCard.tsx
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EDBTimelineDialog } from "@/components/EDBTimelineDialog";
import { PDFViewer } from '@/components/PDFileViewer';
import { SupplierSelectionDialog } from '@/components/SupplierSelectionDialog';
import { useToast } from '@/components/ui/use-toast';
import { EDBStatus, EDB, Attachment } from '../data/types';
import { BadgeCheck, Check, Copy, MoreVertical, Paperclip } from "lucide-react";

type EDBDetailsCardProps = {
  edb: EDB;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary"><small className="text-xs">Brouillon</small></Badge>;
    case 'SUBMITTED':
      return <Badge variant="outline"><small className="text-xs">Soumis</small></Badge>;
    case 'APPROVED_RESPONSABLE':
      return <Badge variant="secondary"><small className="text-xs">Approuvé (Resp.)</small></Badge>;
    case 'APPROVED_DIRECTEUR':
      return <Badge variant="secondary"><small className="text-xs">Approuvé (Dir.)</small></Badge>;
    case 'APPROVED_DG':
      return <Badge variant="secondary"><small className="text-xs">Approuvé (DG)</small></Badge>;
    case 'MAGASINIER_ATTACHED':
      return <Badge variant="outline"><small className="text-xs">Document Rattaché</small></Badge>;
    case 'SUPPLIER_CHOSEN':
      return <Badge variant="outline"><small className="text-xs">Fournisseur Choisi</small></Badge>;
    case 'REJECTED':
      return <Badge variant="destructive"><small className="text-xs">Rejeté</small></Badge>;
    default:
      return <Badge variant="default"><small className="text-xs">{status}</small></Badge>;
  }
};

export const EDBDetailsCard: React.FC<EDBDetailsCardProps> = ({ edb }) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [currentPdfIndex, setCurrentPdfIndex] = useState<number | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isChoosingSupplier, setIsChoosingSupplier] = useState(false);

  useEffect(() => {
    // Reset states when edb changes
    setCurrentPdfIndex(null);
    setIsPdfModalOpen(false);
    setSelectedAttachment(null);
    setIsSupplierDialogOpen(false);
    setIsChoosingSupplier(false);
  }, [edb]);

  if (!edb) {
    return <Card><CardContent>Aucune donnée disponible</CardContent></Card>;
  }

  const isSupplierChosen = !!edb.finalSupplier;
  const chosenFilePath = edb.finalSupplier?.filePath;

  const isITCategory = ['Matériel informatique', 'Logiciels et licences'].includes(edb.category);

  const canSelectSupplier = (attachment: Attachment) => {
    return isITCategory ? session?.user?.role === 'IT_ADMIN' : !!session?.user;
  };
  
  const handleSelectSupplier = async (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setIsSupplierDialogOpen(true);
  };

  const handleConfirmSupplier = async () => {
    if (!selectedAttachment) return;

    setIsChoosingSupplier(true);
    try {
      const response = await fetch('/api/edb/select-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edbId: edb.id,
          attachmentId: selectedAttachment.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setIsChoosingSupplier(false);
        throw new Error(errorData.error || 'Erreur lors de la sélection du fournisseur');
      }

      toast({
        title: 'Fournisseur sélectionné',
        description: 'Le fournisseur a été sélectionné avec succès.',
      });

      setIsChoosingSupplier(false);
      setIsSupplierDialogOpen(false);
      setIsPdfModalOpen(false);
      setIsChoosingSupplier(true);
      
      // Here you might want to refresh the EDB data or update local state
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la sélection du fournisseur.',
        variant: 'destructive',
      });
      setIsChoosingSupplier(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start border-b">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
            # {edb.edbId}
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => navigator.clipboard.writeText(edb.edbId)}
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copier ID EDB</span>
            </Button>
          </CardTitle>
          <CardDescription>Statut: {getStatusBadge(edb.status)}</CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <EDBTimelineDialog 
            edb={{
              id: edb.id,
              edbId: edb.edbId,
              status: edb.status as EDBStatus,
              auditLogs: edb.auditLogs
            }} 
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Plus</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Modifier</DropdownMenuItem>
              <DropdownMenuItem>Exporter</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <ul className="grid gap-3">
            <li className="flex items-center justify-between">
              <span className="font-semibold">Désignation</span>
              <span className="font-semibold">QTE</span>
            </li>
          </ul>
          <ul className="grid gap-1">
            <ScrollArea className="w-full rounded-md h-16 p-2 border">
              {edb.description.items.map((item: { designation: string; quantity: number }, index: React.Key) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {item.designation}
                  </span>
                  <span>x {item.quantity}</span>
                </li>
              ))}
            </ScrollArea>
          </ul>
          <Separator className="my-2" />
          <ul className="grid">
            <li className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground">Total - Estimé (XOF)</span>
              <span>{edb.finalSupplier?.amount.toLocaleString() || "En attente" }</span>
            </li>
          </ul>
        </div>
        <Separator className="my-4" />
        <div className="font-semibold">Factures Rattachés</div>
        <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
          <div className="flex w-max space-x-1 p-1 justify-start gap-1">
            {edb.attachments.map((attachment, index) => (
              <Button 
              key={attachment.id} 
              variant={attachment.filePath === chosenFilePath ? "default" : "outline"}
              onClick={() => {
                  setCurrentPdfIndex(index);
                  setIsPdfModalOpen(true);
                }}
            >
              {attachment.filePath === chosenFilePath ? (
                <BadgeCheck className="h-4 w-4 mr-1" />
              ) : (
                <Paperclip className="h-4 w-4 mr-1" />
              )}
              {attachment.fileName}
            </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {currentPdfIndex !== null && edb.attachments && edb.attachments.length > currentPdfIndex && (
          <PDFViewer
            fileUrl={edb.attachments[currentPdfIndex].filePath}
            fileName={edb.attachments[currentPdfIndex].fileName}
            canSelectSupplier={canSelectSupplier(edb.attachments[currentPdfIndex])}
            onSelectSupplier={() => handleSelectSupplier(edb.attachments[currentPdfIndex])}
            open={isPdfModalOpen}
            onOpenChange={setIsPdfModalOpen}
            supplierName={edb.attachments[currentPdfIndex].supplierName}
            isITCategory={isITCategory}
            isSupplierChosen={isSupplierChosen}
            isCurrentAttachmentChosen={edb.attachments[currentPdfIndex].filePath === chosenFilePath}
            amount={edb.attachments[currentPdfIndex].totalAmount}
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Date: <time dateTime={edb.createdAt}>{new Date(edb.createdAt).toLocaleDateString('fr-FR')}</time>
        </div>
      </CardFooter>
      <SupplierSelectionDialog
        fileName={selectedAttachment?.fileName || ''}
        onConfirm={handleConfirmSupplier}
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
        supplierName={selectedAttachment?.supplierName}
        isLoading={isChoosingSupplier}
        isChosen={selectedAttachment?.filePath === chosenFilePath}
      />
    </Card>
  );
};