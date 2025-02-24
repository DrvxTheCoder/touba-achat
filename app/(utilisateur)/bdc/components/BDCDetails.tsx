"use client"

import { useSession } from "next-auth/react";
import { useState } from "react";
import { BDC } from "../types/bdc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, FileCheck, FileX, CheckCircle, BanIcon, Trash2, AlertCircle, AlertTriangle, CoinsIcon, HandCoinsIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Access, BDCStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { BDCSummaryPDFDialog } from "./BDCSummaryPDFDialog";
import { PrintBDCButton } from "./PrintBDCButton";
import { StatusBadge } from "@/app/dashboard/etats/components/StatusBadge";
import { Icons } from "@/components/icons";

interface BDCDetailsProps {
  bdc: BDC;
  onRefresh: () => Promise<void>;
}

function formatDate(date: Date | string) {
  if (!(date instanceof Date) && typeof date !== 'string') {
    return 'Invalid Date';
  }
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const rejectFormSchema = z.object({
  reason: z.string().min(1, "La raison du rejet est requise"),
});

type RejectFormData = z.infer<typeof rejectFormSchema>;

export function BDCDetails({ bdc, onRefresh }: BDCDetailsProps) {
  const { data: session } = useSession();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isApproveDafDialogOpen, setIsApproveDafDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Check if user is from DAF department
  const isDafDepartment = bdc.department.name === "Direction Administrative et Financière";
  
  // Check if user has admin or DG role (they can approve any department's BDCs)
  const hasOverrideRole = session?.user?.role === "DIRECTEUR_GENERAL" || session?.user?.role === "ADMIN";
  
  // Check if user is a director from the same department as the BDC
  const isDirectorOfSameDept = (userRole?: string | null, departmentName?: string) => {
    if (!userRole || !departmentName) return false;
    
    // If user is DAF, they can approve DAF department BDCs
    if (userRole === "DAF" && departmentName === "Direction Administrative et Financière") {
      return true;
    }

    if (userRole === "DOG" && departmentName === "Direction Opération Gaz") {
      return true;
    }

    if (userRole === "DCM" && departmentName === "Direction Commerciale et Marketing") {
      return true;
    }

    if (userRole === "DRH" && departmentName === "Direction Ressources Humaines") {
      return true;
    }
    if (userRole === "DIRECTEUR") {
      return true;
    }
    return false;
  };

  const canApprove = (userRole?: string | null) => {
    if (!userRole) return false;
    
    switch (bdc.status) {
      case "SUBMITTED":
      case "APPROVED_RESPONSABLE":
        // Admin and DG can approve any BDC
        if (hasOverrideRole) return true;
        
        // Directors can only approve their department's BDCs
        return isDirectorOfSameDept(userRole, bdc.department.name);
        
      case "APPROVED_DIRECTEUR":
        return userRole === "DAF";
      default:
        return false;
    }
  };

  const canApproveDAF = (userRole?: string | null) => {
    if (!userRole) return false;
    switch (bdc.status) {
      case "APPROVED_DIRECTEUR":
        return ["DAF", "DIRECTEUR_GENERAL", "ADMIN"].includes(userRole);
      default:
        return false;
    }
  };

  const canReject = (userRole?: string | null) => {
    if (!userRole) return false;
    
    // Admin and DG can reject any BDC
    if (["DIRECTEUR_GENERAL", "ADMIN"].includes(userRole)) {
      return !["PRINTED", "REJECTED"].includes(bdc.status);
    }
    
    // DAF can reject any BDC in APPROVED_DIRECTEUR status
    if (userRole === "DAF" && bdc.status === "APPROVED_DIRECTEUR") {
      return true;
    }
    
    // Directors can only reject their department's BDCs
    return ["DIRECTEUR", "DOG", "DCM", "DRH", "DAF"].includes(userRole) &&
           isDirectorOfSameDept(userRole, bdc.department.name) &&
           !["PRINTED", "REJECTED"].includes(bdc.status);
  };
  
  const canDelete = (userRole?: string | null) => {
    if (!userRole) return false;
    return ["ADMIN"].includes(userRole);
  }

  const canPrint = (userRole?: Role, userAccesses?: Access[]) => {
    // Check for allowed roles
    const isAllowedRole = ["DAF", "ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"].includes(userRole as string);
    
    // Check for CASHIER access, ensuring userAccesses is an array
    const hasCashierAccess = Array.isArray(userAccesses) && 
      userAccesses.some(access => access === 'CASHIER');
  
    // For APPROVED_DAF status, either role or CASHIER access is sufficient
    if (bdc.status === 'APPROVED_DAF' || bdc.status === 'PRINTED') {
      return isAllowedRole || hasCashierAccess;
    }
  
    return false;
  };

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bdc?id=${bdc.id}&action=approve`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'approbation');
      }

      toast.success("Succès", {
        description: "Le bon de caisse a été approuvé"
      });

      await onRefresh();
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'approbation"
      });
    } finally {
      setIsApproveDialogOpen(false);
      setIsLoading(false);
    }
  };

  const handleApproveDAF = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bdc?id=${bdc.id}&action=approve-daf`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'approbation');
      }

      toast.success("Succès", {
        description: "Le bon de caisse a été approuvé par la DAF"
      });

      await onRefresh();
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'approbation DAF"
      });
    } finally {
      setIsApproveDafDialogOpen(false);
      setIsLoading(false);
    }
  };

  const handleReject = async (data: RejectFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bdc?id=${bdc.id}&action=reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du rejet');
      }

      setIsRejectDialogOpen(false);
      form.reset();

      toast.success("Succès", {
        description: "Le bon de caisse a été rejeté"
      });

      await onRefresh();
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du rejet"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bdc?id=${bdc.id}&action=print`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'impression');
      }

      toast.success("Succès", {
        description: "Le bon de caisse est prêt pour impression"
      });

      await onRefresh();
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la préparation pour impression"
      });
    } finally {
      setIsPrintDialogOpen(false);
      setIsLoading(false);
    }
  };

  // Add delete handler
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bdc?id=${bdc.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      toast.success("BDC supprimé avec succès");
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setIsLoading(false);
    }
  };

  // Determine if we should show the "Approval requires director" button
  const showDirectorRequiredButton = 
    session?.user?.role === "DAF" && 
    !isDafDepartment && 
    ["SUBMITTED", "APPROVED_RESPONSABLE"].includes(bdc.status) &&
    !hasOverrideRole;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">Détails du BDC</CardTitle>
          <StatusBadge status={bdc.status}/>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[400px] p-4 border border-dashed rounded-lg">
            <div className="space-y-4">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-2">Informations Générales</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID:</p>
                    <p>{bdc.bdcId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Département:</p>
                    <p>{bdc.department.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Créé par:</p>
                    <p>{bdc.creator.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de création:</p>
                    <p>{formatDate(bdc.createdAt)}</p>
                  </div>
                  {(bdc.approver?.name) && (
                    <div>
                      <p className="font-extrabold">Approbation Dir.:</p>
                      <p>{bdc.approver?.name}</p>
                    </div>
                  )}
                  {(bdc.approverDAF?.name) && (
                    <div>
                      <p className="font-extrabold">Approbation DAF:</p>
                      <p>{bdc.approverDAF?.name}</p>
                    </div>
                  )}
                  {(bdc.printedBy?.name) && (
                    <div>
                      <p className="font-extrabold">Décaissé par:</p>
                      <p>{bdc.printedBy?.name}</p>
                    </div>
                  )}
                  {bdc.status === "REJECTED" && bdc.auditLogs && bdc.auditLogs.length > 0 && (
                    <div>
                      <p className="font-extrabold text-destructive">Rejeté par:</p>
                      <p>{bdc.auditLogs.find(log => log.eventType === "REJECTED")?.user?.id || "Inconnu"}</p>
                    </div>
                  )}  
                </div>
              </div>

              <Separator />

              {/* Title and Description */}
              <div>
                <h3 className="font-semibold mb-2">Titre/Motif</h3>
                <p className="text-sm">{bdc.title}</p>
              </div>

              <Separator />
              

              {/* Employees */}
              {bdc.employees.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-2">Employés Concernés</h3>
                    <Table className="border-none">
                    <TableHeader>
                        <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Rôle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bdc.employees.map((employee, index) => (
                        <TableRow key={index}>
                            <TableCell>{employee.name}</TableCell>
                            <TableCell>{employee.role}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              ) }

            <Separator />

              {/* Expense Items */}
              <div>
                <h3 className="font-semibold mb-2">Articles et Montants</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bdc.description.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell className="text-right">XOF {item.amount}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-extrabold">XOF {bdc.totalAmount}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>


              {bdc.comment && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Commentaire</h3>
                    <p className="text-sm">{bdc.comment}</p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
          {bdc.rejectionReason && (
                <div className="flex flex-row items-center text-destructive h-8 gap-1">
                  <BanIcon className="mr-2 h-4 w-4" />
                  {`Justificatif: ${bdc.rejectionReason}`}
                </div>
              )}

          {/* Action Buttons */}
            <div className="flex flex-row justify-between items-center gap-2 pt-4 border-t">
              <div className="flex flex-row gap-2">
                {canApprove(session?.user?.role) && bdc.status !== 'APPROVED_DIRECTEUR' && (
                  <Button
                    onClick={() => setIsApproveDialogOpen(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="text-primary h-8 gap-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approuver
                  </Button>
                )}
                
                {/* Show disabled button for DAF users viewing BDCs from other departments */}
                {showDirectorRequiredButton && (
                  <Button
                    disabled={true}
                    variant="outline"
                    className="h-8 gap-1"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Approbation Direction Requise
                  </Button>
                )}
                
                {canApproveDAF(session?.user?.role) && bdc.status === 'APPROVED_DIRECTEUR' && (
                  <Button
                    onClick={() => setIsApproveDafDialogOpen(true)}
                    disabled={isLoading}
                    className="text-primary gap-1 h-8"
                    variant="outline"
                  >
                    <HandCoinsIcon className="mr-2 h-4 w-4" />
                    Approuver (DAF)
                  </Button>
                )}
                {canReject(session?.user?.role) && (bdc.status !== 'APPROVED_DAF') && (
                  <Button
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="text-destructive gap-1 h-8"
                  >
                    <BanIcon className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                )}
                {canPrint(session?.user?.role, session?.user?.access) && (
                  <Button
                    onClick={() => setIsPrintDialogOpen(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="gap-1 h-8"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer
                  </Button>
                )}
              </div>
              
              {canDelete(session?.user?.role) && (
              <div>
                <Button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                    variant="destructive"
                    className="h-8"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              )}
            </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le bon de caisse</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir approuver ce bon de caisse?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 p-3 rounded-lg w-full border border-dashed">
            <p className="text-sm font-bold">Employé: <text className="font-normal">{bdc.creator.name}</text></p>
            <p className="text-sm font-bold">Montant total: <text className="font-normal">XOF {bdc.totalAmount}</text></p>
            <p className="text-sm font-bold">Département: <text className="font-normal">{bdc.department.name}</text></p>
          </div>
          <DialogFooter>

            <div className="w-full flex flex-row justify-between items-center">
            <p className="text-muted-foreground flex flex-row gap-1 items-center font-medium"> 
              <AlertTriangle className="h-3 w-3" />
              <small>Action irréversible</small>
            </p>
              <div className="flex flex-row gap-2">
                <Button
                type="button"
                variant="ghost"
                onClick={() => setIsApproveDialogOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                variant="default"
              >
                Confirmer
                {isLoading && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}
              </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve DAF Dialog */}
      <Dialog open={isApproveDafDialogOpen} onOpenChange={setIsApproveDafDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le bon de caisse (DAF)</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir approuver ce bon de caisse en tant que DAF ? Cette action permettra de décaisser les fonds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 p-3 rounded-lg w-full border border-dashed">
            <p className="text-sm font-bold">Employé: <text className="font-normal">{bdc.creator.name}</text></p>
            <p className="text-sm font-bold">Montant total: <text className="font-normal">XOF {bdc.totalAmount}</text></p>
            <p className="text-sm font-bold">Département: <text className="font-normal">{bdc.department.name}</text></p>
          </div>
          <DialogFooter>

            <div className="w-full flex flex-row justify-between items-center">
            <p className="text-muted-foreground flex flex-row gap-1 items-center font-medium"> 
              <AlertTriangle className="h-3 w-3" />
              <small>Action irréversible</small>
            </p>
              <div className="flex flex-row gap-2">
                <Button
                type="button"
                variant="ghost"
                onClick={() => setIsApproveDafDialogOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleApproveDAF}
                disabled={isLoading}
                variant="default"
              >
                Confirmer
                {isLoading && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}
              </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impression BDC</DialogTitle>
            <DialogDescription>
              Confirmez-vous l&apos;impression / décaissement du BDC? 
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 p-3 rounded-lg w-full border border-dashed">
            <p className="text-sm font-bold">Employé: <text className="font-normal">{bdc.creator.name}</text></p>
            <p className="text-sm font-bold">Total: <text className="font-normal">XOF {bdc.totalAmount}</text></p>
            <p className="text-sm font-bold">Département: <text className="font-normal">{bdc.department.name}</text></p>
            <p className="text-sm font-bold">Approuvé par: <text className="font-normal">{bdc.approver?.name}</text></p>
            <p className="text-sm font-bold">Approbation DAF: <text className="font-normal">{bdc.approverDAF?.name}</text></p>
          </div>
          <DialogFooter>
            <div className="w-full flex flex-row justify-between items-center">
            <p className="text-muted-foreground flex flex-row gap-1 items-center font-medium"> 
              <AlertTriangle className="h-3 w-3" />
              <small>Action irréversible</small>
            </p>
              <div className="flex flex-row gap-2">
                <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPrintDialogOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <PrintBDCButton 
                  bdcId={bdc.id}
                  disabled={isLoading}
                  onPrintComplete={() => {
                  setIsPrintDialogOpen(false);
                  onRefresh();
                }} />
              </div>
            </div>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le bon de caisse</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleReject)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison du rejet</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Expliquez la raison du rejet..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRejectDialogOpen(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="destructive"
                >
                  Rejeter
                  {isLoading && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le bon de caisse</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p>Êtes-vous sûr de vouloir supprimer ce bon de caisse ? Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
            >
              Supprimer
              {isLoading && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}