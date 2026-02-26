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
import { BadgeCheck, Ban, Calculator, Clock, Copy, Edit, FileClock, MoreVertical, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ODMSummaryPDFDialog from './ODMSummaryPDFDialog';
import { useSession } from 'next-auth/react';
import { ODMDRHValidationDialog } from './ODMDRHValidationDialog';
import { Icons } from '@/components/icons';
import RichTextDisplay from './RichTextDisplay';
import { ODM_CATEGORY_LABELS } from '../utils/odm';
import { Access } from '@prisma/client';
import { ODMFinanceApprovalDialog } from './ODMFinanceApprovalDialog';
import Link from 'next/link';
import { ODMRejectionDialog } from './ODMRejectionDialog';

type ODMSingleProps = {
  odm: any;
  userRole?: string;
};

export const ODMSingle: React.FC<ODMSingleProps> = ({ odm: initialOdm, userRole: initialUserRole }) => {
  const [odm, setOdm] = useState(initialOdm);
  const [userRole, setUserRole] = useState(initialUserRole);
  const [userAccess, setUserAccess] = useState<Access[]>([]);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [userJobTitle, setUserJobTitle] = useState<string | null>(null);
  const { data: session } = useSession();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = useMemo(() => {
    if (!odm || !session?.user) return false;
    if (session.user.role === 'ADMIN') return true;
    return (
      odm.creator?.user?.id === session.user.id &&
      ['DRAFT', 'SUBMITTED'].includes(odm.status)
    );
  }, [odm, session?.user]);

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
            setUserAccess(data.access || []);
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
  const [isDRHApprovalDialogOpen, setIsDRHApprovalDialogOpen] = useState(false);
  const [isDOGApprovalDialogOpen, setIsDOGApprovalDialogOpen] = useState(false);
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);
  const [restartTarget, setRestartTarget] = useState<'processing' | 'dog'>('processing');
  const [isValidating, setIsValidating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  // Check if ODM has been processed (has cost information)
  const isProcessed = ['AWAITING_DRH_VALIDATION', 'AWAITING_DOG_APPROVAL', 'READY_FOR_PRINT', 'AWAITING_FINANCE_APPROVAL', 'COMPLETED'].includes(odm.status);
  const isCompleted = odm.status === 'COMPLETED';

  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  const missionCostTotal = odm.missionCostPerDay * days;

  // Permission checks based on role and access
  const isAuthorizedDirector = ['DIRECTEUR', 'DIRECTEUR_GENERAL', 'ADMIN', 'DAF', 'DOG', 'DCM', 'DRH'].includes(userRole || '');

  // Can approve as director (SUBMITTED -> AWAITING_DRH_APPROVAL)
  const canApproveAsDirector = useMemo(() => {
    if (odm.status !== 'SUBMITTED') return false;
    return isAuthorizedDirector || userAccess.includes('ODM_DIRECTOR_APPROVE' as Access);
  }, [odm.status, isAuthorizedDirector, userAccess]);

  // Can approve as DRH (AWAITING_DRH_APPROVAL -> RH_PROCESSING)
  const canApproveAsDRH = useMemo(() => {
    if (odm.status !== 'AWAITING_DRH_APPROVAL' && odm.status !== 'AWAITING_RH_PROCESSING') return false;
    return userRole === 'DRH' || userRole === 'ADMIN' || userAccess.includes('ODM_DRH_APPROVE' as Access);
  }, [odm.status, userRole, userAccess]);

  // Can process as RH (RH_PROCESSING -> AWAITING_DRH_VALIDATION)
  const canProcess = useMemo(() => {
    if (odm.status !== 'RH_PROCESSING') return false;
    return userRole === 'RH' || userRole === 'DRH' || userRole === 'ADMIN' || userAccess.includes('ODM_RH_PROCESS' as Access);
  }, [odm.status, userRole, userAccess]);

  // Can validate as DRH (AWAITING_DRH_VALIDATION -> AWAITING_DOG_APPROVAL)
  const canValidateAsDRH = useMemo(() => {
    if (odm.status !== 'AWAITING_DRH_VALIDATION') return false;
    return userRole === 'DRH' || userRole === 'ADMIN' || userAccess.includes('ODM_DRH_APPROVE' as Access);
  }, [odm.status, userRole, userAccess]);

  // Can approve as DOG (AWAITING_DOG_APPROVAL -> READY_FOR_PRINT)
  const canApproveAsDOG = useMemo(() => {
    if (odm.status !== 'AWAITING_DOG_APPROVAL' && odm.status !== 'AWAITING_FINANCE_APPROVAL') return false;
    return userRole === 'DOG' || userRole === 'ADMIN' || userRole === 'DAF' || userAccess.includes('ODM_DOG_APPROVE' as Access);
  }, [odm.status, userRole, userAccess]);

  // Can restart rejected ODM (DRH only)
  const canRestartODM = useMemo(() => {
    if (odm.status !== 'REJECTED') return false;
    return userRole === 'DRH' || userRole === 'ADMIN' || userAccess.includes('ODM_DRH_APPROVE' as Access);
  }, [odm.status, userRole, userAccess]);

  // Can edit processed ODM (RH and DRH)
  const canEdit = useMemo(() => {
    if (!isProcessed) return false;
    if (isCompleted) return false; // No edits allowed if already completed
    return userRole === 'RH' || userRole === 'DRH' || userRole === 'ADMIN' || userAccess.includes('ODM_RH_PROCESS' as Access);
  }, [isProcessed, isCompleted, userRole, userAccess]);

  // Can print (READY_FOR_PRINT status)
  const canPrint = odm.status === 'READY_FOR_PRINT' || odm.status === 'COMPLETED';

  // Legacy checks (kept for backward compatibility)
  const isRHDirector = (
    (userRole === "DIRECTEUR" && userDepartment === "Direction Ressources Humaines") ||
    userRole === "DRH"
  );
  const canValidateAsRHDirector = isRHDirector && (odm.status === 'AWAITING_RH_PROCESSING' || odm.status === 'AWAITING_DRH_APPROVAL');
  const isFinanceDirector = userRole === "DIRECTEUR" && userDepartment === "Direction Administrative et Financière";
  const canApproveFinance = (isFinanceDirector || userRole === 'DOG' || userRole === 'ADMIN') &&
    (odm.status === 'AWAITING_FINANCE_APPROVAL' || odm.status === 'AWAITING_DOG_APPROVAL');

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
        body: JSON.stringify({ reason }),
      });

      if (!rejectionResponse.ok) {
        const errorData = await rejectionResponse.json();
        throw new Error(errorData.error || 'Echec de validation');
      }

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
      console.error('Error rejecting ODM:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors du rejet de l'ODM.",
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

  // Director approval (SUBMITTED -> AWAITING_DRH_APPROVAL)
  const handleConfirmValidation = async () => {
    if (!odm) return;
    setIsValidating(true);
    try {
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'director_approve' }),
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Echec de validation');
      }

      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);

      toast.success("ODM Validé", {
        description: `L'ODM #${odm.odmId} a été validé par le directeur.`,
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

  // DRH approval for RH processing (AWAITING_DRH_APPROVAL -> RH_PROCESSING)
  const handleConfirmDRHApproval = async () => {
    if (!odm) return;
    setIsValidating(true);
    try {
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'drh_approve' }),
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Failed to approve ODM as DRH');
      }

      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);

      toast.success("ODM envoyé pour traitement", {
        description: `L'ODM #${odm.odmId} a été envoyé aux Ressources Humaines pour traitement.`,
      });
    } catch (error: any) {
      console.error('Error approving ODM as DRH:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setIsValidating(false);
      setIsDRHApprovalDialogOpen(false);
      setIsDRHValidationDialogOpen(false);
    }
  };

  // DRH validation (AWAITING_DRH_VALIDATION -> AWAITING_DOG_APPROVAL)
  const handleConfirmDRHValidation = async () => {
    if (!odm) return;
    setIsValidating(true);
    try {
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'drh_validate' }),
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Failed to validate ODM as DRH');
      }

      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);

      toast.success("ODM validé par DRH", {
        description: `L'ODM #${odm.odmId} a été validé et envoyé pour approbation DOG.`,
      });
    } catch (error: any) {
      console.error('Error validating ODM as DRH:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setIsValidating(false);
      setIsDRHValidationDialogOpen(false);
    }
  };

  // DOG approval (AWAITING_DOG_APPROVAL -> READY_FOR_PRINT)
  const handleConfirmDOGApproval = async () => {
    if (!odm) return;
    setIsValidating(true);
    try {
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'dog_approve' }),
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Failed to approve ODM as DOG');
      }

      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);

      toast.success("ODM approuvé par DOG", {
        description: `L'ODM #${odm.odmId} est maintenant prêt pour impression.`,
      });
    } catch (error: any) {
      console.error('Error approving ODM as DOG:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setIsValidating(false);
      setIsDOGApprovalDialogOpen(false);
      setIsFinanceApprovalDialogOpen(false);
    }
  };

  // Restart rejected ODM
  const handleRestartODM = async (target: 'processing' | 'dog') => {
    if (!odm) return;
    setIsValidating(true);
    try {
      const action = target === 'processing' ? 'restart_to_processing' : 'restart_to_dog';
      const approvalResponse = await fetch(`/api/odm/${odm.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || 'Failed to restart ODM');
      }

      const updatedOdmResponse = await fetch(`/api/odm/${odm.id}`);
      if (!updatedOdmResponse.ok) {
        throw new Error('Failed to fetch updated ODM data');
      }
      const updatedOdm = await updatedOdmResponse.json();
      setOdm(updatedOdm);

      toast.success("ODM redémarré", {
        description: target === 'processing'
          ? `L'ODM #${odm.odmId} a été renvoyé pour traitement RH.`
          : `L'ODM #${odm.odmId} a été renvoyé pour approbation DOG.`,
      });
    } catch (error: any) {
      console.error('Error restarting ODM:', error);
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setIsValidating(false);
      setIsRestartDialogOpen(false);
    }
  };

  const handleProcessed = async () => {
    try {
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

  // Legacy finance approval handler (now maps to DOG approval)
  const handleFinanceApproval = async (reason?: string) => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/odm/${odm.id}/finance-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, reason }),
      });

      if (!response.ok) throw new Error('Failed to approve ODM');

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

      if (!response.ok) throw new Error('Failed to reject ODM');

      toast.success("ODM rejeté");
      router.push('/dashboard/odm');
    } catch (error) {
      console.error('Error rejecting ODM:', error);
      toast.error("Erreur lors du rejet");
    } finally {
      setIsValidating(false);
      setIsFinanceApprovalDialogOpen(false);
    }
  };

  return (
    <>
      <title>Ordre de Mission - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6 pb-24">
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
                  {canPrint && (
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
                        <DropdownMenuItem onClick={handleEditProcessingClick}>
                          Modifier le traitement
                          <DropdownMenuShortcut><Edit className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* Director approval */}
                      {canApproveAsDirector && (
                        <DropdownMenuItem onClick={handleValidate} className="text-primary">
                          Approuver (Directeur)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* DRH approval for RH processing */}
                      {canApproveAsDRH && (
                        <DropdownMenuItem onClick={() => setIsDRHApprovalDialogOpen(true)} className="text-primary">
                          Envoyer au traitement RH
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* DRH validation after RH processing */}
                      {canValidateAsDRH && (
                        <DropdownMenuItem onClick={() => setIsDRHValidationDialogOpen(true)} className="text-primary">
                          Valider (DRH)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* DOG approval */}
                      {canApproveAsDOG && (
                        <DropdownMenuItem onClick={() => setIsFinanceApprovalDialogOpen(true)} className="text-primary">
                          Approuver (DOG)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* Legacy: RH Director validation (for AWAITING_RH_PROCESSING status) */}
                      {canValidateAsRHDirector && !canApproveAsDRH && (
                        <DropdownMenuItem onClick={() => setIsDRHApprovalDialogOpen(true)} className="text-primary">
                          Validation (DRH)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* Legacy: Finance approval */}
                      {canApproveFinance && !canApproveAsDOG && (
                        <DropdownMenuItem onClick={() => setIsFinanceApprovalDialogOpen(true)} className="text-primary">
                          Validation (DAF)
                          <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}

                      {/* Restart rejected ODM */}
                      {canRestartODM && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setRestartTarget('processing'); setIsRestartDialogOpen(true); }} className="text-blue-600">
                            Redémarrer vers traitement RH
                            <DropdownMenuShortcut><RotateCcw className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setRestartTarget('dog'); setIsRestartDialogOpen(true); }} className="text-blue-600">
                            Redémarrer vers approbation DOG
                            <DropdownMenuShortcut><RotateCcw className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* Reject option */}
                      {isAuthorizedDirector && odm.status !== 'REJECTED' && odm.status !== 'READY_FOR_PRINT' && odm.status !== 'COMPLETED' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleReject} className="text-destructive">
                            Rejeter
                            <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />
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
                          {odm.missionCostPerDay !== 0 && (
                            <li className="flex justify-between">
                              <span>{odm.creator?.user?.name || odm.creator?.name || 'N/A'} {`(${odm.missionCostPerDay.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} x ${days}jrs)`}</span>
                              <span>{missionCostTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
                            </li>
                          )}
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

                          {odm.expenseItems.length > 0 && (
                            <li className="border-t pt-2 mt-2">
                              <span className="font-medium">Dépenses additionnelles:</span>
                            </li>
                          )}

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
                      <p className="text-sm">Les coûts de la mission s&apos;afficheront ici une fois traité <br /> par les <a href={`mailto:rh@touba-oil.com`} className="text-primary">Ressources Humaines</a></p>
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

      {/* DRH Approval Dialog (for sending to RH processing) */}
      <AlertDialog open={isDRHApprovalDialogOpen} onOpenChange={setIsDRHApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer pour traitement RH</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir envoyer l&apos;ODM #{odm.odmId} pour traitement par les Ressources Humaines ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isValidating}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDRHApproval();
              }}
              disabled={isValidating}
            >
              {isValidating && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DRH Validation Dialog (for validating RH work) */}
      <ODMDRHValidationDialog
        isOpen={isDRHValidationDialogOpen && canValidateAsDRH}
        onClose={() => setIsDRHValidationDialogOpen(false)}
        onConfirm={handleConfirmDRHValidation}
        odmId={odm.odmId}
        isLoading={isValidating}
      />

      {/* Director Validation Dialog */}
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

      {/* DOG/Finance Approval Dialog */}
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

      {/* Restart Dialog */}
      <AlertDialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redémarrer l&apos;ODM</AlertDialogTitle>
            <AlertDialogDescription>
              {restartTarget === 'processing'
                ? `Êtes-vous sûr de vouloir renvoyer l'ODM #${odm.odmId} pour traitement RH ? Le statut rejeté sera effacé.`
                : `Êtes-vous sûr de vouloir renvoyer l'ODM #${odm.odmId} pour approbation DOG ? Le statut rejeté sera effacé.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isValidating}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRestartODM(restartTarget);
              }}
              disabled={isValidating}
            >
              {isValidating && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
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
