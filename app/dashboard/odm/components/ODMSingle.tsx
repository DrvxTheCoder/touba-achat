"use client"
// components/ODMSingle.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ODMTimeline } from './ODMEventTimeline';
import { ODMProcessingForm } from './ODMProcessingForm';
import { ODMEditProcessingDialog } from './ODMEditProcessingForm';
import { ODMValidationDialog } from './ODMValidationDialog';
import { StatusBadge } from '../../etats/components/StatusBadge';
import { BadgeCheck, Ban, Calculator, Clock, Copy, Edit, FileClock, MoreVertical, RefreshCw, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ODMSummaryPDFDialog from './ODMSummaryPDFDialog';
import { useSession } from 'next-auth/react';
import prisma from '@/lib/prisma';
import { ODMDRHValidationDialog } from './ODMDRHValidationDialog';
import { Icons } from '@/components/icons';
import RichTextDisplay from './RichTextDisplay';
import { ODM_CATEGORY_LABELS } from '../utils/odm';
import { Access } from '@prisma/client';
import { ODMFinanceApprovalDialog } from './ODMFinanceApprovalDialog';
import Link from 'next/link';
import { ODMRejectionDialog } from './ODMRejectionDialog';

type ODMSingleProps = {
  odm: any; // Replace with proper ODM type
  userRole?: string;
};

export const ODMSingle: React.FC<ODMSingleProps> = ({ odm: initialOdm, userRole: initialUserRole }) => {
  const [odm, setOdm] = useState(initialOdm);
  const [userRole, setUserRole] = useState(initialUserRole);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [userJobTitle, setUserJobTitle] = useState<string | null>(null);
  const { data: session } = useSession();

  // Add these states
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Add this helper function to check if user can delete
const canDelete = useMemo(() => {
  if (!odm || !session?.user) return false;
  
  if (session.user.role === 'ADMIN') return true;
  
  return (
    odm.creator?.user?.id === session.user.id && 
    ['DRAFT', 'SUBMITTED'].includes(odm.status)
  );
}, [odm, session?.user]);

// Add this function to handle deletion
const handleDelete = async () => {
  if (!odm) return;
  setIsDeleting(true);
  try {
    const response = await fetch(`/api/odm/${odm.id}/delete`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }
    
    toast.success("ODM Supprimé", {
      description: `L'ODM #${odm.odmId} a été supprimé avec succès.`,
    });
    
    // Redirect to the ODMs list
    router.push('/dashboard/odm');
  } catch (error: any) {
    console.error('Error deleting ODM:', error);
    toast.error("Erreur", {
      description: error.message || "Une erreur est survenue lors de la suppression.",
    });
  } finally {
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  }
};

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/employee/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role || initialUserRole);
            setUserDepartment(data.employee?.currentDepartment?.name || null);
            setUserJobTitle(data.employee?.jobTitle || null);
          } else {
            console.error('Failed to fetch user details');
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
    };
    fetchUserDetails();
  }, [session, initialUserRole]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};
const dateRange = `${formatDate(odm.startDate)} au ${formatDate(odm.endDate)}`;

  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isDRHValidationDialogOpen, setIsDRHValidationDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();
  const isProcessed = (odm.status === 'AWAITING_FINANCE_APPROVAL') || (odm.status === 'COMPLETED');
  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  const missionCostTotal = odm.missionCostPerDay * days;

 
  const isAuthorized = userRole === "DIRECTEUR" || userRole === "DIRECTEUR_GENERAL" || userRole === "ADMIN" || userRole === "DAF" || userRole === "DOG" || userRole === "DCM" || userRole === "DRH";
  const canValidate = odm.status === 'SUBMITTED';
  const canProcess = userRole === 'RH' && odm.status === 'RH_PROCESSING';
  const canEdit = userRole === 'RH' && isProcessed;
  const isRHDirector = userRole === "DIRECTEUR" && userDepartment === "Direction Ressources Humaines";
  const canValidateAsRHDirector = isRHDirector && odm.status === 'AWAITING_RH_PROCESSING';

  const isFinanceDirector = userRole === "DIRECTEUR" && userDepartment === "Direction Administrative et Financière";
  const canApproveFinance = isFinanceDirector && odm.status === 'AWAITING_FINANCE_APPROVAL';
  const [isFinanceApprovalDialogOpen, setIsFinanceApprovalDialogOpen] = useState(false);

  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReject = () => {
    setIsRejectionDialogOpen(true);
  }

  const handleConfirmRejection = async (reason: string) => {
    if (!odm) return;
    setIsRejecting(true);
    try {
      const rejectionResponse = await fetch(`/api/odm/${odm.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }), // Send an empty object as the body
      });
  
      if (!rejectionResponse.ok) {
        const errorData = await rejectionResponse.json();
        throw new Error(errorData.error || 'Echec de validation');
      }
  
      // Fetch the updated ODM data
      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);
      
      toast.info("ODM Rejeté", {
        description: `L'ordre de mission (${odm.odmId}) a été rejeté avec succès.`,
      });
    } catch (error: any) {
      console.error('Error validating ODM:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de la validation de l'ODM.",
      });
    } finally {
      setIsRejecting(false);
      setIsRejectionDialogOpen(false);
    }
  }


  const handleValidate = () => {
    setIsValidationDialogOpen(true);
  };

  const handleEditProcessingClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleConfirmValidation = async () => {
    if (!odm) return;
    setIsValidating(true);
    try {
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send an empty object as the body
      });
  
      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Echec de validation');
      }
  
      // Fetch the updated ODM data
      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);
      
      toast.success("ODM Validé", {
        description: `L'ODM #${odm.odmId} a été validé avec succès.`,
      });
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

  const handleConfirmDRHValidation = async () => {
    if (!odm || !isRHDirector) return;
    setIsValidating(true);
    try {
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval?action=approveRHDirector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approveRHDirector' }),
      });
  
      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Failed to validate ODM as RH Director');
      }
  
    // Fetch the updated ODM data
      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);
      
      toast.success("ODM Validé par DRH", {
        description: `L'ODM #${odm.odmId} a été validé avec succès par le Directeur RH.`,
      });
    } catch (error: any) {
      console.error('Error validating ODM as RH Director:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de la validation de l'ODM par le Directeur RH.",
      });
    } finally {
      setIsValidating(false);
      setIsDRHValidationDialogOpen(false);
    }
  };

  const handleProcessed = async () => {
    try {
      const response = await fetch(`/api/odm/${odm.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
    // Fetch the updated ODM data
    const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
    if (!updatedOdmResponse.ok) {
      throw new Error('Failed to fetch updated ODM data');
    }
    const updatedOdm = await updatedOdmResponse.json();
    setOdm(updatedOdm);
    
    toast.success("Traité", {
      description: `L'ODM #${odm.odmId} a été traité.`,
    });
      router.refresh();
    } catch (error) {
      console.error('Error fetching updated ODM data:', error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la mise à jour des données de l'ODM.",
      });
    }
  };

  const handleFinanceApproval = async (reason?: string) => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/odm/${odm.id}/finance-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, reason }),
      });
  
      if (!response.ok) throw new Error('Failed to approve ODM');
      
      // const updatedOdm = await response.json();
      // setOdm(updatedOdm);
      toast.success("ODM validé avec succès!");
      router.push('/dashboard/odm');
      
    } catch (error) {
      console.error('Error approving ODM:', error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setIsValidating(false);
      setIsFinanceApprovalDialogOpen(false);
    }
  };

  const handleFinanceReject = async (reason: string) => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/odm/${odm.id}/finance-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, reason }),
      });
  
      if (!response.ok) throw new Error('Failed to approve ODM');
      
      // const updatedOdm = await response.json();
      // setOdm(updatedOdm);
      toast.success("ODM rejeté");
      router.push('/dashboard/odm');
    } catch (error) {
      console.error('Error approving ODM:', error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setIsValidating(false);
      setIsFinanceApprovalDialogOpen(false);
    }
  };

  return (
    <>
      <title>Ordre de Mission - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6 pb-10">
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
                      {/* <DropdownMenuItem>
                        Modifier
                      </DropdownMenuItem> */}
                      {canEdit && (
                        <DropdownMenuItem onClick={handleEditProcessingClick}>
                            Modifier le traitement
                        <DropdownMenuShortcut><Edit className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                      </DropdownMenuItem>
                      )}
                      {isAuthorized && (
                        <>
                        
                        <DropdownMenuItem onClick={handleValidate} disabled={!canValidate} className="text-primary">
                            Approuver
                        <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleReject} disabled={odm.status === 'REJECTED'} className="text-destructive">
                            Rejeter
                            <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </>

                      )}
                      {canValidateAsRHDirector && (
                        <DropdownMenuItem onClick={() => setIsDRHValidationDialogOpen(true)} className="text-primary">
                          Validation (DRH)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                      {canApproveFinance && (
                        <DropdownMenuItem onClick={() => setIsFinanceApprovalDialogOpen(true)} className="text-primary">
                          Validation (DAF)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={!canDelete}
                      >
                        Supprimer
                        <DropdownMenuShortcut>
                          <Trash2 className="ml-4 h-4 w-4" />
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* <Link href={`/dashboard/odm/${odm.odmId}`} prefetch={false} replace={true}>
                    <Button variant={"outline"} className="h-8 gap-1 "><RefreshCw className="h-4 w-4" /></Button>
                  </Link> */}
                  {/* <Button variant={"outline"} className="h-8 gap-1" onClick={() => router.replace(`/dashboard/odm/${odm.odmId}`)}><RefreshCw className="h-4 w-4" /></Button> */}
                </div>
              </CardHeader>
              <CardContent className="p-5">
              <div className="grid gap-3">
                {odm.status === 'REJECTED' && (
                  <strong className="text-destructive">Raison de rejet: {odm.rejectionReason}</strong>
                )}
                <strong className="">Objet: {odm.title}</strong>
                <text className="text-sm">Periode: {dateRange} {`- ${days} jour(s)`}</text>
                <text className="text-sm">Type: {odm.missionType}</text>
                <text className="text-sm">Lieu: {odm.location}</text>
                
                
                {isProcessed && odm.expenseItems ? (
                <div>
                <h3 className="font-semibold mb-2">Dépenses:</h3>
                <ScrollArea className="w-full rounded-md h-max max-h-48 p-3 border border-dashed text-muted-foreground">
                  <ul className="text-xs lg:text-sm space-y-2">
                    {/* Main mission cost */}
                    {odm.missionCostPerDay !== 0 && (
                      <li className="flex justify-between">
                        <span>{odm.creator?.user?.name || odm.creator?.name || 'N/A'} {`(${odm.missionCostPerDay.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} x ${days}jrs)`}</span>
                        <span>{missionCostTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
                      </li>
                    )}
                    {/* Accompanying persons costs */}
                    {odm.hasAccompanying && odm.accompanyingPersons?.map((person: any, index: number) => (
                      <li key={index} className="flex justify-between">
                        <span>
                          {person.name}
                          {` (${person.costPerDay.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} x ${days}jrs)`}
                        </span>
                        <span>
                          {(person.costPerDay * days).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </span>
                      </li>
                    ))}

                    {/* Separator for additional expenses */}
                    {odm.expenseItems.length > 0 && (
                      <li className="border-t pt-2 mt-2">
                        <span className="font-medium">Dépenses additionnelles:</span>
                      </li>
                    )}

                    {/* Additional expenses */}
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
                            <text key={index}>{person.name},</text>
                        ))}
                        </div>
                    </div>
                )}
                </div>
                <Separator className="my-4" />
                <div>
                  <text className="">Description: </text>
                  <div className='text-sm text-muted-foreground'>
                    <RichTextDisplay content={odm.description} />
                  </div>
                </div>
                <Separator className="my-2" />
                <div>
                  Véhicule: {odm.vehicule}
                </div>

                <Separator className="my-2" />
                <div className="grid gap-3">
              <div className="font-semibold">Émetteur :</div>
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
                accompanyingPersons={odm.hasAccompanying ? odm.accompanyingPersons : []}
              />
            </div>
          )}
          <div className="col-span-4 lg:col-span-2">
            <ODMTimeline odm={odm} />
          </div>
        </div>
      </main>
      <ODMDRHValidationDialog 
        isOpen={isDRHValidationDialogOpen && isRHDirector}
        onClose={() => setIsDRHValidationDialogOpen(false)}
        onConfirm={handleConfirmDRHValidation}
        odmId={odm.odmId}
        isLoading={isValidating}
      />
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
      <ODMFinanceApprovalDialog 
        isOpen={isFinanceApprovalDialogOpen}
        onClose={() => setIsFinanceApprovalDialogOpen(false)}
        onConfirm={handleFinanceApproval}
        onReject={handleFinanceReject}
        odmId={odm.odmId}
        isLoading={isValidating}
        totalAmount={odm.totalCost || 0}
      />
      <ODMRejectionDialog
        isOpen={isRejectionDialogOpen}
        isLoading={isRejecting}
        onClose={() => setIsRejectionDialogOpen(false)}
        onConfirm={handleConfirmRejection}
        odmId={odm.odmId}
      />
      {/* Add this just before the closing tag of your component */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;ODM #{odm.odmId} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};