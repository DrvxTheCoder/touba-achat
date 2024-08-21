"use client"
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  File,
  ListFilter,
  MoreVertical,
  Paperclip,
  PackageIcon,
  RefreshCwIcon,
  Clock,
  Ban,
  FileCheck2,
  BadgeCheck,
  ArrowBigUpDash
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PlusCircle } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Attachment, EDB } from '@/app/(utilisateur)/etats-de-besoin/data/types';
import { EDBTableRow } from '../data/EDBTableRow'
import { CategoriesDialog } from "./categories-dialog"
import { PDFViewer } from "@/components/PDFileViewer"
import { SupplierSelectionDialog } from "@/components/SupplierSelectionDialog"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import MetricCard from "./metricCard"
import { useEDBs } from "./use-edbs"
import { SpinnerCircular } from "spinners-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { ValidationDialog } from "./ValidationDialog"
import { RejectionDialog } from "./RejectionDialog"
import { EscalationDialog } from "./EscalationDialog"
import { StatusBadge } from "./StatusBadge"
import { canPerformAction } from "../utils/can-perform-action"
import { AttachDocumentDialog } from "./AttachDocumentDialog"
import { EDBTimelineDialog } from "@/components/EDBTimelineDialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Role } from "@prisma/client"
import { EDBTimeline } from "@/components/EDBTimeline"
import { Router } from "next/router"
import EDBSummaryPDFDialog from "./EDBSummaryDialog"

const statusMapping = {
    'Brouillon': ['DRAFT'],
    'Soumis': ['SUBMITTED'],
    'Validé': ['APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'IT_APPROVED', 'APPROVED_DG'],
    'En attente': ['AWAITING_MAGASINIER', 'AWAITING_SUPPLIER_CHOICE', 'AWAITING_IT_APPROVAL', 'AWAITING_FINAL_APPROVAL'],
    'Traitement en cours': ['MAGASINIER_ATTACHED', 'SUPPLIER_CHOSEN'],
    'Rejeté': ['REJECTED'],
    'Complété': ['COMPLETED']
  };
  
  type EDBStatus = 
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVED_RESPONSABLE'
    | 'APPROVED_DIRECTEUR'
    | 'AWAITING_MAGASINIER'
    | 'MAGASINIER_ATTACHED'
    | 'AWAITING_SUPPLIER_CHOICE'
    | 'SUPPLIER_CHOSEN'
    | 'AWAITING_IT_APPROVAL'
    | 'IT_APPROVED'
    | 'AWAITING_FINAL_APPROVAL'
    | 'APPROVED_DG'
    | 'ESCALATED'
    | 'REJECTED'
    | 'COMPLETED';
  
  type UserRole = 'RESPONSABLE' | 'DIRECTEUR' | 'IT_ADMIN' | 'DIRECTEUR_GENERAL' | 'ADMIN' | 'MAGASINIER' | 'USER';
  
  type StatusMappingKey = keyof typeof statusMapping;
  
  type AttachmentMetadata = {
    file: File;
    invoiceName: string;
    supplierName: string;
    totalAmount: number;
    url?: string; // This will be added by the upload process
  };
  
  type SupplierSelectingRole = Extract<Role, 'ADMIN' | 'RESPONSABLE' | 'DIRECTEUR' | 'DIRECTEUR_GENERAL'>;
  
  function isValidStatusMappingKey(key: string): key is StatusMappingKey {
    return key in statusMapping;
  }
  
  function canRoleSelectSupplier(role: Role): role is SupplierSelectingRole {
    return ['ADMIN', 'RESPONSABLE', 'DIRECTEUR', 'DIRECTEUR_GENERAL'].includes(role);
  }

  function formatDate(date: Date | string) {
    if (!(date instanceof Date) && typeof date !== 'string') {
      return 'Invalid Date';
    }
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  export function EtatsSingle({ edb }: { edb: any }) {  // Replace 'any' with a proper type for your EDB

    const [edbData, setEdbData] = useState(edb);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEDB = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/edb/${edb.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch EDB');
        }
        const data = await response.json();
        setEdbData(data);
      } catch (error) {
        console.error('Error fetching EDB:', error);
        toast.error("Erreur lors du rafraîchissement des données");
      } finally {
        setIsLoading(false);
      }
    };

    const { data: session } = useSession();
    const [currentPage, setCurrentPage] = useState(1);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isEscalating, setIsEscalating] = useState(false);
    const [isAttachDocumentDialogOpen, setIsAttachDocumentDialogOpen] = useState(false);
  
    const [currentPdfIndex, setCurrentPdfIndex] = useState<number | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isChoosingSupplier, setIsChoosingSupplier] = useState(false);
  
    const isMagasinier = session?.user?.role === Role.MAGASINIER;
    const isDirecteur = session?.user?.role === Role.DIRECTEUR;
    const isEscalated = edb?.status === 'ESCALATED';
    const canEscalate = edb?.status === 'APPROVED_RESPONSABLE' || edb?.status === 'SUBMITTED'
    const hasAttachments = edb?.attachments && edb.attachments.length > 0;
  
    const isITCategory = edb && ['Matériel informatique', 'Logiciels et licences'].includes(edb.category);
    const chosenFilePath = edb?.finalSupplier?.filePath;
    const isSupplierChosen = !!edb?.finalSupplier;

    const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
    const [isEscalationDialogOpen, setIsEscalationDialogOpen] = useState(false);
  
    const canSelectSupplier = (attachment: Attachment) => {
      if (!session?.user?.role) return false;
    
      const userRole = session.user.role as Role;
    
      if (isITCategory) {
        return userRole === 'IT_ADMIN';
      } else {
        return canRoleSelectSupplier(userRole);
      }
    };
  
    const handleSelectSupplier = async (attachment: Attachment) => {
      setIsSupplierDialogOpen(true);
    };
  
    const handleConfirmSupplier = async () => {
      if (!edb || currentPdfIndex === null) return;
  
      setIsChoosingSupplier(true);
      try {
        const response = await fetch('/api/edb/select-supplier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            edbId: edb.id,
            attachmentId: edb.attachments[currentPdfIndex].id,
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la sélection du fournisseur');
        }
        await fetchEDB(); // Refetch the EDB data
        toast.success("Fournisseur sélectionné",{
          description: 'Le fournisseur a été sélectionné avec succès.',
        });
      } catch (error) {
        toast.error('Erreur',{
          description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la sélection du fournisseur.',
        });
      } finally {
        setIsChoosingSupplier(false);
        setIsSupplierDialogOpen(false);
        setIsPdfModalOpen(false);
      }
    };
  
  
    const userInfo = useMemo(() => ({
      role: session?.user?.role || '',
    }), [session?.user?.role]);
  
    const statusFilter = useMemo(() => {
      return selectedFilters
        .filter(isValidStatusMappingKey)
        .flatMap(key => statusMapping[key]);
    }, [selectedFilters]);
  
    const { canValidate, canReject } = useMemo(() => {
      if (!edb || !session?.user?.role) return { canValidate: false, canReject: false };
      return canPerformAction(
        edb.status as EDBStatus, 
        session.user.role as UserRole, 
        edb.category
      );
    }, [edb, session?.user?.role]);

    const handleValidate = async () => {
        setIsValidationDialogOpen(true);
      };
    
      const handleEscalate = async () => {
        setIsEscalationDialogOpen(true);
      };
    
      const handleReject = async () => {
        setIsRejectionDialogOpen(true);
      };
    
      const confirmValidation = async () => {
        if (!edbData) return;
        setIsValidating(true);
        try {
          const response = await fetch(`/api/edb/${edbData.id}/validate`, {
            method: 'POST',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to validate EDB');
          }
          toast.success("EDB Validé", {
            description: `L'EDB #${edbData.id} a été validé avec succès.`,
          });
          await fetchEDB(); // Refetch the EDB data
        } catch (error : any) {
          console.error('Error validating EDB:', error);
          toast.error("Erreur", {
            description: error.message || "Une erreur est survenue lors de la validation de l'EDB.",
          });
        } finally {
          setIsValidating(false);
          setIsValidationDialogOpen(false);
        }
      };

      const confirmEscalation = async () => {
        if (!edb) return;
        setIsEscalating(true);
        try {
          const response = await fetch(`/api/edb/${edb.id}/escalate`, {
            method: 'POST',
          });
          if (!response.ok) {
            const errorData = await response.json();
            setIsEscalating(true);
            throw new Error(errorData.message || 'Erreur lors de l\'opération.');
          }
          await fetchEDB(); // Refetch the EDB data
          toast.success("EDB Validé",{
            description: `L'EDB #${edb.edbId} a été escaladé à la Direction Générale.`,
          });
          setIsEscalating(false);
        } catch (error : any) {
          console.error('Error validating EDB:', error);
          toast.error("Erreur",{
            description: error.message || "Une erreur est survenue lors de l\'opération.",
          });
          setIsEscalating(false);
        } finally {
          setIsValidationDialogOpen(false);
        }
      };
    
      const confirmRejection = async (reason: string) => {
        if (!edb) return;
        setIsRejecting(true);
        try {
          const response = await fetch(`/api/edb/${edb.id}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            setIsRejecting(false);
            throw new Error(errorData.message || 'Failed to reject EDB'); 
          }
          await fetchEDB();
          toast.info("EDB Rejeté",{
            description: `L'EDB #${edb.id} a été rejeté.`,
          });
          setIsRejecting(false);
        } catch (error : any) {
          console.error('Error rejecting EDB:', error);
          toast.error("Erreur",{
            description: error.message || "Une erreur est survenue lors du rejet de l'EDB.",
          });
          setIsRejecting(false);
        } finally {
          setIsRejectionDialogOpen(false);
        }
      };

      useEffect(() => {
        console.log("Dialog open state:", isAttachDocumentDialogOpen);
      }, [isAttachDocumentDialogOpen]);
    
      const handleOpenAttachDialog = useCallback(() => {
        if (edb && isMagasinier && !hasAttachments) {
          setIsAttachDocumentDialogOpen(true);
        } else {
          toast.error("Action non autorisée",{
            description: "Des documents sont déjà attachés à cet EDB." 
          });
        }
      }, [edb, isMagasinier, hasAttachments]);
      const handleUploadSuccess = useCallback(async (attachments: AttachmentMetadata[]) => {
        if (!edb) return;
    
        try {
          // Here you would typically send the attachments data to your backend
          const response = await fetch(`/api/edb/${edb.id}/attachments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ attachments }),
          });
    
          if (!response.ok) {
            throw new Error('Failed to save attachments');
          }
    
          // Refresh the EDB data
        //   await refetch();
    
          toast.success("Succès",{
            description: `${attachments.length} document(s) ont été attachés à l'EDB #${edb.id}.`,
          });
        } catch (error) {
          console.error('Error saving attachments:', error);
          toast.error("Erreur",{
            description: "Une erreur est survenue lors de l'enregistrement des documents.",
          });
        }
      }, [edb]);

  return (
    <>
    <title>États de Besoins - Touba App™</title>
    <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
    <div>
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight"># {edb.edbId}</h2>
        </div>
    </div>
    <div className="grid flex-1 items-start md:gap-8 gap-4 lg:grid-cols-3 xl:grid-cols-3">
      
      <div className="grid auto-rows-max items-start gap-4 md:gap-4 lg:col-span-2">


        <Card>
        <CardHeader className="flex flex-row items-start border-b">
        <div className="grid gap-0.5">
        <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
            # {edb.edbId}
            <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            >
            <Copy className="h-3 w-3" onClick={() => {
            const textToCopy = `${edb.edbId}`;
            navigator.clipboard.writeText(textToCopy);  
            toast.info("Copie réussi",{
                description: `L\'ID a été copié dans le presse-papier.`,
            })
            }} />
            <span className="sr-only">Copier ID EDB</span>
            </Button>
        </CardTitle>
        <CardDescription>Statut: 
            <StatusBadge 
            status={edb.status} 
            rejectionReason={edb.rejectionReason}
            />
        </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-1">

        <EDBTimelineDialog 
            edb={{
            id: edb.id,
            edbId: edb.edbId || edb.id, // Fallback to id if edbId is not present
            status: edb.status as EDBStatus,
            auditLogs: edb.auditLogs || [] // Provide an empty array if auditLogs is undefined
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
            
            {isMagasinier && (
                <DropdownMenuItem 
                    onSelect={handleOpenAttachDialog}
                    disabled={hasAttachments}
                >
                    Joindre document(s)
                    <Paperclip className="ml-2 h-4 w-4" />
                </DropdownMenuItem>
                )}
            <DropdownMenuItem disabled>Bon de Commande
            <DropdownMenuShortcut><FileCheck2 className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="text-primary"
                onClick={handleValidate}
                disabled={!canValidate}
            >
                Valider
                <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            {isDirecteur && (
            <DropdownMenuItem 
                className="text-sky-500"
                onClick={handleEscalate}
                disabled={!canEscalate}
            >
                Escalader
                <DropdownMenuShortcut><ArrowBigUpDash className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            )}
            <DropdownMenuItem 
                className="text-destructive"
                onClick={handleReject}
                disabled={!canReject}
            >
                Rejeter
                <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>


            </DropdownMenuContent>
        </DropdownMenu>
        <AttachDocumentDialog 
            isOpen={isAttachDocumentDialogOpen}
            onOpenChange={setIsAttachDocumentDialogOpen}
            onUploadSuccess={handleUploadSuccess}
        />
            <ValidationDialog 
                isOpen={isValidationDialogOpen}
                onClose={() => setIsValidationDialogOpen(false)}
                onConfirm={confirmValidation}
                edbId={edb.id}
                isLoading={isValidating}
            />
            <EscalationDialog 
                isOpen={isEscalationDialogOpen}
                onClose={() => setIsEscalationDialogOpen(false)}
                onConfirm={confirmEscalation}
                edbId={edb.id}
                isLoading={isEscalating}
            />
            <RejectionDialog 
                isOpen={isRejectionDialogOpen}
                onClose={() => {
                setIsRejectionDialogOpen(false);
                setIsRejecting(false);
                }}
                onConfirm={confirmRejection}
                edbId={edb.id}
                isLoading={isRejecting}
            />

        <EDBSummaryPDFDialog edb={edb} />
        </div>
        </CardHeader>
        <CardContent className="p-5 text-sm">
                
                <div className="grid gap-3">
                  <text className="text-muted-foreground">Titre: {edb.title}</text>
                  <ul className="grid gap-3">
                  <li className="flex items-center justify-between">
                    <span className="font-semibold">Désignation</span>
                    <span className="font-semibold">QTE</span>
                  </li>
                  </ul>
                  <ul className="grid gap-3">
                  <Popover>
                    <PopoverTrigger>   
                    <ScrollArea className="w-full rounded-md h-24 p-2 border">
                        {edb.description && Array.isArray(edb.description.items) ? (
                        edb.description.items.map((item: { designation: string; quantity: number }, index: React.Key) => (
                            <li className="flex items-center justify-between" key={index}>
                            <span className="text-muted-foreground">{item.designation}</span>
                            <span>x {item.quantity}</span>
                            </li>
                        ))
                        ) : (
                        <li>Aucun élement</li>
                        )}
                    </ScrollArea>
                    </PopoverTrigger>
                    <PopoverContent>
                        <ul className="grid gap-3">
                        {edb.description && Array.isArray(edb.description.items) ? (
                            edb.description.items.map((item: { 
                            designation: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; 
                            quantity: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined 
                            }, index: React.Key | null | undefined) => (
                            <li className="flex items-center justify-between" key={index}>
                                <span className="text-muted-foreground text-xs">{item.designation}</span>
                                <span className="text-muted-foreground font-bold text-xs">x {item.quantity}</span>
                            </li>
                            ))
                        ) : (
                            <li>Aucun élément</li>
                        )}
                        </ul>
                    </PopoverContent>
                  </Popover>

                  </ul>
                  <span className="font-semibold">Références Techniques</span>
                  <span className="text-muted-foreground">Non-renseigné</span>
                  <Separator className="my-2" />
                  <ul className="grid gap-3">
                    <li className="flex items-center justify-between font-semibold">
                      <span className="text-muted-foreground">Total - Estimé (XOF)</span>
                      <span>{edb.finalSupplier?.amount.toLocaleString() || "En attente" }</span>
                    </li>
                  </ul>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  <div className="font-semibold">Information Employé</div>
                  <dl className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Nom et Prenom</dt>
                      <dd>{edb.creator.name}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Departement</dt>
                    <dd>
                        {typeof edb.department === 'object' ? edb.department.name : edb.department}
                    </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>
                        <a href={`mailto:${edb.creator.email}`}>{edb.creator.email}</a>
                      </dd>
                    </div>
                  </dl>
                </div>
                {/* <Separator className="my-4" />
                  <div className="font-semibold">Document Rattaché (Service ACHAT)</div>
                  <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
                    <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
                    {edb.attachments.map((attachment: any) => (
                        <>
                        <Button 
                        key={attachment.id} 
                          variant={attachment.filePath === chosenFilePath ? "default" : "outline"}
                          onClick={() => {
                            setCurrentPdfIndex(attachment.id);
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

                              </>
                      ))}
                      {edb.attachments?.length < 1 && (
                        <Button variant="outline" disabled><Paperclip className="h-4 w-4 mr-1" /> Aucun document attaché</Button>
                      )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea> */}
              </CardContent>
              <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                <div className="text-xs text-muted-foreground">Date: {"  "} 
                    <time dateTime={edb.createdAt instanceof Date ? edb.createdAt.toISOString() : edb.createdAt}>
                        {formatDate(edb.createdAt)}
                    </time>
                </div>
              </CardFooter>
        </Card>
      </div>

      <div className="gap-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Pièces jointes</h2>
        <div className="flex w-max space-x-1 justify-start gap-2 ">
        {edb.attachments.map((attachment: any) => (
            <>
            <Button 
            key={attachment.id} 
                variant={attachment.filePath === chosenFilePath ? "default" : "outline"}
                onClick={() => {
                setCurrentPdfIndex(attachment.id);
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
            <PDFViewer
                fileUrl={attachment.filePath}
                fileName={attachment.fileName}
                canSelectSupplier={canSelectSupplier(attachment.id)}
                onSelectSupplier={() => handleSelectSupplier(attachment.id)}
                open={isPdfModalOpen}
                onOpenChange={setIsPdfModalOpen}
                supplierName={attachment.supplierName}
                isITCategory={isITCategory}
                isSupplierChosen={isSupplierChosen}
                isCurrentAttachmentChosen={attachment.filePath === chosenFilePath}
                amount={attachment.totalAmount}
            />
            </>
            ))}
            {edb.attachments?.length < 1 && (
            <Button variant="outline" disabled><Paperclip className="h-4 w-4 mr-1" /> Aucun document attaché</Button>
            )}
        </div>
        <EDBTimeline edb={edb}/>
        
      </div>
    </div>
    </main>

    </>

  );
}