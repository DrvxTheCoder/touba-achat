"use client"
// components/ODMSingle.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ODMTimeline } from './ODMEventTimeline';
import { ODMProcessingForm } from './ODMProcessingForm';
import { ODMEditProcessingDialog } from './ODMEditProcessingForm';
import { ODMValidationDialog } from './ODMValidationDialog';
import { StatusBadge } from '../../etats/components/StatusBadge';
import { BadgeCheck, Ban, Calculator, Clock, Copy, Edit, FileClock, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ODMSummaryPDFDialog from './ODMSummaryPDFDialog';

type ODMSingleProps = {
  odm: any; // Replace with proper ODM type
  userRole: string;
};

export const ODMSingle: React.FC<ODMSingleProps> = ({ odm: initialOdm, userRole }) => {
  const [odm, setOdm] = useState(initialOdm);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();
  const isProcessed = odm.status === 'COMPLETED' || odm.status === 'RH_PROCESSING';
  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  const missionCostTotal = odm.missionCostPerDay * days;

  const canValidate = ['DIRECTEUR', 'DIRECTEUR_GENERAL'].includes(userRole) && odm.status === 'SUBMITTED';
  const canProcess = userRole === 'RH' && odm.status === 'AWAITING_RH_PROCESSING';
  const canEdit = userRole === 'RH' && isProcessed;

  const handleValidate = () => {
    setIsValidationDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleConfirmValidation = async () => {
    if (!odm) return;
    setIsValidating(true);
    try {
      // First, perform the validation
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
      });
      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.message || 'Failed to validate ODM');
      }
  
      // Then, fetch the updated ODM data
      const updatedOdmResponse = await fetch(`/api/odm/${odm.odmId}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
  
      setOdm(updatedOdm);
      toast.success("ODM Validé", {
        description: `L'ODM #${odm.odmId} a été validé avec succès.`,
      });
  
      // Optionally, you can still redirect if needed
      // router.push(`/dashboard/odm/${odm.odmId}`);
    } catch (error: any) {
      console.error('Error validating ODM:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de la validation de l'ODM.",
      });
    } finally {
      setIsValidating(false);
      setIsValidationDialogOpen(false);
    }
  };

  const handleProcessed = async () => {
    try {
      const response = await fetch(`/api/odm/${odm.odmId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await response.json();
      setOdm(updatedOdm);
      toast.success("ODM traité avec succès", {
        description: `L'ODM #${odm.odmId} a été traité et mis à jour.`,
      });
      router.refresh();
    } catch (error) {
      console.error('Error fetching updated ODM data:', error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la mise à jour des données de l'ODM.",
      });
    }
  };

  return (
    <>
      <title>Ordre de Mission - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-4 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-start border-b">
                <div className="grid gap-0.5">
                  <CardTitle className="group flex items-center gap-2 hover:underline underline-offset-2 lg:text-xl text-sm">
                    #{odm.odmId}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(odm.odmId);
                        toast.info("Copie réussi", {
                          description: `L'ID a été copié dans le presse-papier.`,
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="sr-only">Copier ID ODM</span>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Statut: <StatusBadge status={odm.status} />
                  </CardDescription>
                </div>
                <div className="ml-auto flex items-center gap-1">
                {isProcessed && (
                    <ODMSummaryPDFDialog odm={odm} />
                )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <MoreVertical className="h-3.5 w-3.5" />
                        <span className="sr-only">Plus</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onClick={handleEditClick}>
                          Modifier le traitement
                          <DropdownMenuShortcut><Edit className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                      {userRole === "DIRECTEUR" || userRole === "DIRECTEUR_GENERAL" && (
                        <DropdownMenuItem onClick={handleValidate} disabled={!canValidate} className="text-primary">
                            Valider
                            <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-5">
              <div className="grid gap-3">
                <text className="">Objet: {odm.title}</text>
                {isProcessed && odm.expenseItems ? (
                <div>
                    <h3 className="font-semibold mb-2">Dépenses:</h3>
                    <ScrollArea className="w-full rounded-md h-24 p-3 border border-dashed">
                    <ul className="text-xs lg:text-sm">
                        <li className="flex justify-between">
                        <span>Frais de Mission {`(${odm.missionCostPerDay} x ${days}jrs)`}</span>
                        <span>{missionCostTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
                        </li>
                        {odm.expenseItems.map((item: any, index: number) => (
                        <li key={index} className="flex justify-between">
                            <span>{item.type}</span>
                            <span>{item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
                        </li>
                        ))}
                    </ul>
                    </ScrollArea>
                    <div className="mt-2 font-semibold flex justify-between px-2">
                    <span>Total:</span>
                    <span>{odm.totalCost ? odm.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) : 'Non calculé'}</span>
                    </div>

                </div>
                ) : (
                <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                    <center className="mb-2"><FileClock className="h-10 w-10 opacity-50" /></center>
                    <p className="text-sm">Les coûts de la mission s&apos;afficheront ici une fois traité <br/> par les <a href={`mailto:rh@touba-oil.com`} className="text-primary">Ressources Humaines</a></p>
                </div>
                )}
                {odm.hasAccompanying && (
                    <div className="text-sm">
                        <div>{"Collaborateur(s): "}
                        {odm.accompanyingPersons.map((person: any, index: number) => (
                            <text key={index}>{person.name} - {person.role},</text>
                        ))}
                        </div>
                    </div>
                )}
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
              <div className="font-semibold">Information Employé</div>
                <dl className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Nom et Prénom</dt>
                    <dd>{odm.creator?.user?.name || odm.creator?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Département</dt>
                    <dd className="text-xs lg:text-sm">
                      {typeof odm.department === 'object' ? odm.department.name : odm.department || 'N/A'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>
                      <a href={`mailto:${odm.creator?.user?.email || odm.creator?.email || ''}`}>
                        {odm.creator?.user?.email || odm.creator?.email || 'N/A'}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
              </CardContent>
            </Card>
          </div>
          {canProcess && (
            <div className="col-span-4 lg:col-span-2">
              <ODMProcessingForm 
                odmId={odm.id}
                onProcessed={handleProcessed}
                startDate={odm.startDate}
                endDate={odm.endDate}
                missionCostPerDay={odm.missionCostPerDay}
              />
            </div>
          )}
          <div className="col-span-4 lg:col-span-2">
            <ODMTimeline odm={odm} />
          </div>
        </div>
      </main>
      <ODMValidationDialog 
        isOpen={isValidationDialogOpen}
        onClose={() => setIsValidationDialogOpen(false)}
        onConfirm={handleConfirmValidation}
        odmId={odm.odmId}
        isLoading={isValidating}
      />
      <ODMEditProcessingDialog
        odm={odm}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onProcessed={handleProcessed}
      />
    </>
  );
};