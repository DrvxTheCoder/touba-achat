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
  ArrowBigUpDash,
  CheckIcon,
  UserCheck
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
import { Access, Role } from "@prisma/client"
import { OpenInNewWindowIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { FinalApprovalDialog } from "./FinalApprovalDialog"
import { EDBCards } from "./EDBCards"
import { MarkAsCompletedDialog } from "./MarkAsCompleteDialog"

const ITEMS_PER_PAGE = 5;
const statusMapping = {
  'Brouillon': ['DRAFT'],
  'Soumis': ['SUBMITTED'],
  'Validé': ['APPROVED_DIRECTEUR', 'IT_APPROVED', 'APPROVED_DG'],
  'En attente': ['APPROVED_RESPONSABLE','AWAITING_MAGASINIER', 'AWAITING_SUPPLIER_CHOICE', 'AWAITING_IT_APPROVAL', 'AWAITING_FINAL_APPROVAL'],
  'Traitement en cours': ['MAGASINIER_ATTACHED', 'SUPPLIER_CHOSEN'],
  'Rejeté': ['REJECTED'],
  'Complété': ['COMPLETED']
};

export type EDBStatus = 
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




export default function Etats() {

  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isFinalApprobation, setIsFinalApprobation] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isMarkingAsComplete, setIsMarkingAsComplete] = useState(false);
  const [isAttachDocumentDialogOpen, setIsAttachDocumentDialogOpen] = useState(false);

  const [currentPdfIndex, setCurrentPdfIndex] = useState<number | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isChoosingSupplier, setIsChoosingSupplier] = useState(false);

  const isMagasinier = session?.user?.role === Role.MAGASINIER || (session?.user?.access?.includes(Access.ATTACH_DOCUMENTS) ?? false);
  const canAttach = session?.user?.access?.includes(Access.ATTACH_DOCUMENTS);
  const isDirecteur = session?.user?.role === Role.DIRECTEUR;
  const isEscalated = selectedEDB?.status === 'ESCALATED';
  const canEscalate = selectedEDB?.status === 'APPROVED_RESPONSABLE'
  const hasAttachments = selectedEDB?.attachments && selectedEDB.attachments.length > 0;

  const isITCategory = selectedEDB && ['Matériel informatique', 'Logiciels et licences'].includes(selectedEDB.category);
  const chosenFilePath = selectedEDB?.finalSupplier?.filePath;
  const isSupplierChosen = !!selectedEDB?.finalSupplier;

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
    if (!selectedEDB || currentPdfIndex === null) return;

    setIsChoosingSupplier(true);
    try {
      const response = await fetch('/api/edb/select-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edbId: selectedEDB.id,
          attachmentId: selectedEDB.attachments[currentPdfIndex].id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sélection du fournisseur');
      }

      toast("Fournisseur sélectionné",{
        description: 'Le fournisseur a été sélectionné avec succès.',
      });

      refetch(); // Refresh the data
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
    if (!selectedEDB || !session?.user?.role) return { canValidate: false, canReject: false };
    return canPerformAction(
      selectedEDB.status as EDBStatus, 
      session.user.role as UserRole, 
      selectedEDB.category
    );
  }, [selectedEDB, session?.user?.role]);

  const { paginatedData, isLoading, error, refetch } = useEDBs(
    currentPage, 
    ITEMS_PER_PAGE, 
    searchTerm, 
    statusFilter,
    userInfo
  );

  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isFinalApprovalDialogOpen, setIsFinalApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isEscalationDialogOpen, setIsEscalationDialogOpen] = useState(false);
  const [isMarkAsCompleteDialogOpen, setIsMarkAsCompleteDialogOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error("Erreur",{
        description: "Impossible de rafraîchir les données. Veuillez réessayer.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleValidate = async () => {
    setIsValidationDialogOpen(true);
  };
  const handleFinalApproval = async () => {
    setIsFinalApprovalDialogOpen(true);
  };

  const handleEscalate = async () => {
    setIsEscalationDialogOpen(true);
  };

  const handleReject = async () => {
    setIsRejectionDialogOpen(true);
  };

  const handleMarkAsComplete = async () => {
    setIsMarkAsCompleteDialogOpen(true);
  }

  const confirmValidation = async () => {
    if (!selectedEDB) return;
    setIsValidating(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.id}/validate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        setIsValidating(true);
        throw new Error(errorData.message || 'Failed to validate EDB');
      }
      refetch();
      toast.success("EDB Validé",{
        description: `L'EDB #${selectedEDB.id} a été validé avec succès.`,
      });
      setIsValidating(false);
    } catch (error : any) {
      console.error('Error validating EDB:', error);
      toast.error("Erreur",{
        description: error.message || "Une erreur est survenue lors de la validation de l'EDB.",
      });
      setIsValidating(false);
    } finally {
      setIsValidationDialogOpen(false);
    }
  };

  const confirmEscalation = async () => {
    if (!selectedEDB) return;
    setIsEscalating(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.id}/escalate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        setIsEscalating(true);
        throw new Error(errorData.message || 'Erreur lors de l\'opération.');
      }
      refetch();
      toast.success("EDB Validé",{
        description: `L'EDB #${selectedEDB.edbId} a été escaladé à la Direction Générale.`,
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
    if (!selectedEDB) return;
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.id}/reject`, {
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
      refetch();
      toast.info("EDB Rejeté",{
        description: `L'EDB #${selectedEDB.id} a été rejeté.`,
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

  const confirmFinalApproval = async () => {
    if (!selectedEDB) return;
    setIsFinalApprobation(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.id}/finalapproval`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        setIsFinalApprobation(true);
        throw new Error(errorData.message || 'Failed to validate EDB');
      }
      refetch();
      toast.success("EDB Validé",{
        description: `L'EDB #${selectedEDB.id} a été approuvé avec succès.`,
      });
      setIsFinalApprobation(false);
    } catch (error : any) {
      console.error('Error validating EDB:', error);
      toast.error("Erreur",{
        description: error.message || "Une erreur est survenue lors de l'approbation finale de l'EDB.",
      });
      setIsFinalApprobation(false);
    } finally {
      setIsFinalApprovalDialogOpen(false);
    }
  };

  const confirmMarkAsCompleted = async () => {
    if (!selectedEDB) return;
    setIsMarkingAsComplete(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.id}/markascompleted`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        setIsMarkingAsComplete(false);
        throw new Error(errorData.message || 'Erreur lors de opération');
      }
      refetch();
      toast.success("EDB Traité",{
        description: `L'EDB #${selectedEDB.id} a été marqué comme pourvu.`,
      });
      setIsMarkingAsComplete(false);
    } catch (error : any) {
      console.error('Error validating EDB:', error);
      toast.error("Erreur",{
        description: error.message || "Une erreur est survenue lors de l'opération.",
      });
      setIsMarkAsCompleteDialogOpen(false);
    } finally {
      setIsMarkAsCompleteDialogOpen(false);
    }
  };

  const handleRowClick = (edb: EDB) => {
    setSelectedEDB(prevSelected => prevSelected?.id === edb.id ? null : edb);
    setCurrentPdfIndex(null); // Reset the index when selecting a new EDB
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: string) => {
    if (isValidStatusMappingKey(filter)) {
      setSelectedFilters(prev => 
        prev.includes(filter) 
          ? prev.filter(f => f !== filter)
          : [...prev, filter]
      );
      setCurrentPage(1);
    } else {
      console.warn(`Invalid filter: ${filter}`);
    }
  };

  useEffect(() => {
    console.log("Dialog open state:", isAttachDocumentDialogOpen);
  }, [isAttachDocumentDialogOpen]);

  const handleOpenAttachDialog = useCallback(() => {
    if (selectedEDB && isMagasinier && !hasAttachments) {
      setIsAttachDocumentDialogOpen(true);
    } else {
      toast.error("Action non autorisée",{
        description: "Des documents sont déjà attachés à cet EDB." 
      });
    }
  }, [selectedEDB, isMagasinier, hasAttachments]);
  
  const handleUploadSuccess = useCallback(async (attachments: AttachmentMetadata[]) => {
    if (!selectedEDB) return;

    try {
      // Here you would typically send the attachments data to your backend
      const response = await fetch(`/api/edb/${selectedEDB.id}/attachments`, {
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
      await refetch();

      toast.success("Succès",{
        description: `${attachments.length} document(s) ont été attachés à l'EDB #${selectedEDB.id}.`,
      });
    } catch (error) {
      console.error('Error saving attachments:', error);
      toast.error("Erreur",{
        description: "Une erreur est survenue lors de l'enregistrement des documents.",
      });
    }
  }, [selectedEDB, refetch]);

  useEffect(() => {
    if (selectedEDB) {
      console.log('Selected EDB:', selectedEDB);
      console.log('Audit Logs:', selectedEDB.auditLogs);
    }
  }, [selectedEDB]);

  function formatDate(date: Date | string) {
    if (!(date instanceof Date) && typeof date !== 'string') {
      return 'Invalid Date';
    }
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit'
    });
  }

  

  
  return (
    <>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div>
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins</h2>
                <div className="flex items-center space-x-2">
                  {session?.user.role === 'ADMIN' && (
                    <CategoriesDialog />
                  )} 
                  <Link href="/dashboard/etats/nouveau"><Button variant="outline">Nouveau <PlusCircle className="ml-2 h-4 w-4"/></Button></Link>
                </div>
            </div>
        </div>
        <div className="grid flex-1 items-start md:gap-8 lg:grid-cols-3 xl:grid-cols-3 mb-4">
          <div className="grid auto-rows-max items-start gap-4 md:gap-4 lg:col-span-2">
            <EDBCards />
            <div className="flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Input 
                  placeholder="Recherche..." 
                  className="h-7 w-sm lg:max-w-sm ml-2"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-sm"
                    >
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Filtrer</span>
                      {selectedFilters.length !== 0 && (<small>{selectedFilters.length}</small>)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.keys(statusMapping).map((status) => (
                      <DropdownMenuCheckboxItem 
                        key={status}
                        checked={selectedFilters.includes(status)}
                        onCheckedChange={() => handleFilterChange(status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-sm"
                >
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Exporter</span>
                </Button>
              </div>
            </div>
            <div>
              <Card>
                <CardContent className="pt-5">
                  <Table>
                  <TableHeader className="bg-muted">
                      <TableRow className="rounded-lg border-0">
                      <TableHead className="rounded-l-lg">
                          ID
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                          Catégorie
                      </TableHead>
                      <TableHead className="text-right md:text-left">
                          Statut
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                          Département
                      </TableHead>
                      <TableHead className="hidden md:table-cell md:rounded-r-lg">
                          Montant (XOF)
                      </TableHead>
                      <TableHead className="lg:hidden rounded-r-lg">
                          {''}
                      </TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex justify-center items-center h-24">
                          {/* <RefreshCwIcon className="h-6 w-6 animate-spin" /> */}
                          <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                        </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-red-500">
                          Erreur: {error}
                        </TableCell>
                      </TableRow>
                    ) : paginatedData?.edbs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Aucun EDB trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData?.edbs.map((edb) => (
                        <EDBTableRow 
                          key={edb.id} 
                          edb={edb} 
                          onRowClick={handleRowClick}
                          isSelected={selectedEDB?.id === edb.id}
                        />
                      ))
                    )}
                  </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                  <div className="flex flex-row items-center gap-1 text-xs text-muted-foreground">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-6 w-6" 
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCwIcon className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="sr-only">Rafraîchir</span>
                    </Button>
                    <div>
                      Mis à jour: <time dateTime={lastUpdated.toISOString()}>
                        {new Intl.DateTimeFormat('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(lastUpdated)}
                      </time>
                    </div>
                  </div>
                  <Pagination className="ml-auto mr-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-6 w-6"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="sr-only">Précédent</span>
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-6 w-6"
                        onClick={() => setCurrentPage(prev => Math.min(paginatedData?.totalPages || 1, prev + 1))}
                        disabled={currentPage === paginatedData?.totalPages || isLoading}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="sr-only">Suivant</span>
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          {/* Right-side card for EDB details */}
          <div>
            <Card className="overflow-hidden lg:block hidden">
              {selectedEDB ? (
                <>
                <CardHeader className="flex flex-row items-start border-b">
                  <div className="grid gap-0.5">
                    <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
                      # {selectedEDB.edbId}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Copy className="h-3 w-3" onClick={() => {
                        const textToCopy = `${selectedEDB.edbId}`;
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
                        status={selectedEDB.status} 
                        rejectionReason={selectedEDB.rejectionReason}
                      />
                    </CardDescription>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                  {selectedEDB && (
                    <EDBTimelineDialog 
                      edb={{
                        id: selectedEDB.id,
                        edbId: selectedEDB.edbId || selectedEDB.id, // Fallback to id if edbId is not present
                        status: selectedEDB.status as EDBStatus,
                        auditLogs: selectedEDB.auditLogs || [] // Provide an empty array if auditLogs is undefined
                      }} 
                    />
                  )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <MoreVertical className="h-3.5 w-3.5" />
                          <span className="sr-only">Plus</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* <DropdownMenuItem>Modifier</DropdownMenuItem> */}
                        
                        {isMagasinier && (
                          <>
                            <DropdownMenuItem 
                              onSelect={handleOpenAttachDialog}
                              disabled={["SUBMITTED","APPROVED_RESPONSABLE","SUPPLIER_CHOSEN","MAGASINIER_ATTACHED","COMPLETED","FINAL_APPROVAL"].includes(selectedEDB.status)}
                            >
                              Joindre document(s)
                              <Paperclip className="ml-2 h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={handleMarkAsComplete}
                              disabled={selectedEDB.status !== "FINAL_APPROVAL"}
                            >
                              Marquer comme pourvu
                              <FileCheck2 className="ml-2 h-4 w-4" />
                            </DropdownMenuItem>
                            </>
                          )}
                        {/* <DropdownMenuItem disabled>Bon de Commande
                        <DropdownMenuShortcut><FileCheck2 className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem> */}
                        
                        {!isMagasinier || canAttach && (
                          <>
                          <DropdownMenuSeparator />
                          {["SUPPLIER_CHOSEN","FINAL_APPROVAL"].includes(selectedEDB.status) && (
                            <DropdownMenuItem 
                              className="text-primary"
                              onClick={handleFinalApproval}
                              disabled={["COMPLETED","FINAL_APPROVAL"].includes(selectedEDB.status)}
                            >
                              Valider
                              <DropdownMenuShortcut><UserCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                            </DropdownMenuItem>
                          )}
                            <DropdownMenuItem 
                              className="text-primary"
                              onClick={handleValidate}
                              disabled={!canValidate}
                            >
                              Approuver
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
                              disabled={["APPROVED_DG","COMPLETED","FINAL_APPROVAL"].includes(selectedEDB.status)}
                            >
                              Rejeter
                              <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                            </DropdownMenuItem>
                          </>
                        )}



                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href={`/dashboard/etats/${selectedEDB.edbId}`}><Button size="sm" variant="outline" className="h-8 gap-1"> <OpenInNewWindowIcon className="h-4 w-4" /></Button></Link>
                    <AttachDocumentDialog 
                      isOpen={isAttachDocumentDialogOpen}
                      onOpenChange={setIsAttachDocumentDialogOpen}
                      onUploadSuccess={handleUploadSuccess}
                    />
                    {selectedEDB && (
                      <>
                        <MarkAsCompletedDialog
                          isOpen={isMarkAsCompleteDialogOpen}
                          onClose={() => setIsMarkAsCompleteDialogOpen(false)}
                          onConfirm={confirmMarkAsCompleted}
                          edbId = {selectedEDB.id}
                          isLoading={isMarkingAsComplete}
                        />
                        <ValidationDialog 
                          isOpen={isValidationDialogOpen}
                          onClose={() => setIsValidationDialogOpen(false)}
                          onConfirm={confirmValidation}
                          edbId={selectedEDB.id}
                          isLoading={isValidating}
                        />
                        <EscalationDialog 
                          isOpen={isEscalationDialogOpen}
                          onClose={() => setIsEscalationDialogOpen(false)}
                          onConfirm={confirmEscalation}
                          edbId={selectedEDB.id}
                          isLoading={isEscalating}
                        />
                        <RejectionDialog 
                          isOpen={isRejectionDialogOpen}
                          onClose={() => {
                            setIsRejectionDialogOpen(false);
                            setIsRejecting(false);
                          }}
                          onConfirm={confirmRejection}
                          edbId={selectedEDB.id}
                          isLoading={isRejecting}
                        />
                        <FinalApprovalDialog
                          isOpen={isFinalApprovalDialogOpen}
                          onClose={() => setIsFinalApprovalDialogOpen(false)}
                          onConfirm={confirmFinalApproval}
                          edbId={selectedEDB.id}
                          isLoading={isFinalApprobation}
                        />
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-sm">
                
                  <div className="grid gap-3">
                    <small className="text-xs text-muted-foreground"><b>Titre:</b> {selectedEDB.title}</small>
                    <ul className="grid gap-3">
                    <li className="flex items-center justify-between px-3">
                      <span className="font-semibold">Désignation</span>
                      <span className="font-semibold">QTE</span>
                    </li>
                    </ul>
                    <ul className="grid gap-3">
                    <Popover>
                    <PopoverTrigger>   
                      <ScrollArea className="w-full rounded-md h-14 p-2 border">
                        {selectedEDB.items.map((item: { designation: string; quantity: number  }, index: React.Key) => (
                          <li className="flex items-center justify-between" key={index}>
                            <span className="text-muted-foreground">{item.designation}</span>
                            <span>x {item.quantity}</span>
                          </li>
                        ))}
                      </ScrollArea>
                      </PopoverTrigger>
                      <PopoverContent>
                        <ul className="grid gap-3">
                          {selectedEDB.items.map((item: { designation: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; quantity: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined }, index: React.Key | null | undefined) => (
                            <li className="flex items-center justify-between" key={index}>
                              <span className="text-muted-foreground text-xs">{item.designation}</span>
                              <span className="text-muted-foreground font-bold text-xs">x {item.quantity}</span>
                            </li>
                          ))}
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
                        <span>{selectedEDB.finalSupplier?.amount.toLocaleString() || "En attente" }</span>
                      </li>
                    </ul>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid gap-3">
                    <div className="font-semibold">Information Employé</div>
                    <dl className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Nom et Prenom</dt>
                        <dd>{selectedEDB.employee.name}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Departement</dt>
                        <dd>
                          <dd>{selectedEDB.department}</dd>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>
                          <a href={`mailto:${selectedEDB.email}`}>{selectedEDB.email}</a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Separator className="my-4" />
                    <div className="font-semibold">Document Rattaché (Service ACHAT)</div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
                      <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
                        {selectedEDB.attachments?.map((attachment, index) => (
                          <Button 
                            key={index} 
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
                        {selectedEDB.attachments?.length < 1 && (
                          <Button variant="outline" disabled><Paperclip className="h-4 w-4 mr-1" /> Aucun document attaché</Button>
                        )}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                <div className="text-xs text-muted-foreground">Date: {"  "} 
                    <time dateTime={selectedEDB.date}>
                        {formatDate(selectedEDB.date)}
                    </time>
                </div>
                </CardFooter>
                </>
              ) : (
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un EDB pour voir les détails
                </CardContent>
              )}
            </Card>
            {currentPdfIndex !== null && selectedEDB?.attachments?.[currentPdfIndex] && (
              <PDFViewer
                fileUrl={selectedEDB.attachments[currentPdfIndex].filePath}
                fileName={selectedEDB.attachments[currentPdfIndex].fileName}
                canSelectSupplier={canSelectSupplier(selectedEDB.attachments[currentPdfIndex])}
                onSelectSupplier={() => handleSelectSupplier(selectedEDB.attachments[currentPdfIndex])}
                open={isPdfModalOpen}
                onOpenChange={setIsPdfModalOpen}
                supplierName={selectedEDB.attachments[currentPdfIndex].supplierName}
                isITCategory={isITCategory}
                isSupplierChosen={isSupplierChosen}
                isCurrentAttachmentChosen={selectedEDB.attachments[currentPdfIndex].filePath === chosenFilePath}
                amount={selectedEDB.attachments[currentPdfIndex].totalAmount}
              />
            )}

            <SupplierSelectionDialog
              fileName={selectedEDB?.attachments[currentPdfIndex ?? -1]?.fileName || ''}
              onConfirm={handleConfirmSupplier}
              open={isSupplierDialogOpen}
              onOpenChange={setIsSupplierDialogOpen}
              supplierName={selectedEDB?.attachments[currentPdfIndex ?? -1]?.supplierName}
              isLoading={isChoosingSupplier}
              isChosen={selectedEDB?.attachments[currentPdfIndex ?? -1]?.filePath === chosenFilePath}
            />
          </div>
        </div>
      </main>
    </>
  );
}