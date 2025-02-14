"use client"

import { useSession } from "next-auth/react";
import { useState } from "react";
import { BDC } from "../types/bdc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, FileCheck, FileX, CheckCircle, BanIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  const canApprove = (userRole?: string | null) => {
    if (!userRole) return false;
    switch (bdc.status) {
      case "SUBMITTED":
      case "APPROVED_RESPONSABLE":
        return ["DIRECTEUR", "DIRECTEUR_GENERAL", "DOG", "DCM", "DRH", "DAF", "ADMIN"].includes(userRole);
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
    return ["DIRECTEUR", "DIRECTEUR_GENERAL", "DOG", "DAF"].includes(userRole) &&
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
        throw new Error(error.message || 'Erreur lors de l\'impression');
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
                    onClick={handleApprove}
                    disabled={isLoading}
                    variant="outline"
                    className="text-primary h-8 gap-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approuver
                  </Button>
                )}
                {canApproveDAF(session?.user?.role) && bdc.status === 'APPROVED_DIRECTEUR' && (
                  <Button
                    onClick={handleApproveDAF}
                    disabled={isLoading}
                    variant="outline"
                    className="text-primary gap-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approuver (DAF)
                  </Button>
                )}
                {canReject(session?.user?.role) && (
                  <Button
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="text-destructive gap-1"
                  >
                    <BanIcon className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                )}
                {canPrint(session?.user?.role, session?.user?.access) && (
                  <PrintBDCButton bdcId={bdc.id} onPrintComplete={onRefresh} />
                )}
              </div>
              
              {canDelete(session?.user?.role) && (
              <div>
                <Button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                    variant="destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>

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
                </div>
                )}
              

            </div>
        </CardContent>
      </Card>

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
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}