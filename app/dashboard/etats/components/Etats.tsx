"use client"
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  DollarSign,
  File,
  Home,
  ListFilter,
  MoreVertical,
  Package,
  Package2,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users2,
  TrendingDown,
  TrendingUp,
  Paperclip,
  PackageIcon,
  RefreshCcwIcon,
  RefreshCwIcon,
  Clock,
  Ban,
  FileCheck2,
  BadgeCheck
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
import { EDB } from '../data-two/data'
import { EDBTableRow } from '../data-two/EDBTableRow'
import { CategoriesDialog } from "./categories-dialog"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import MetricCard from "./metricCard"
import { useEDBs } from "./use-edbs"
import { SpinnerCircular } from "spinners-react"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { ValidationDialog } from "./ValidationDialog"
import { RejectionDialog } from "./RejectionDialog"
import { StatusBadge } from "./StatusBadge"
import { canPerformAction } from "../utils/can-perform-action"
import { AttachDocumentDialog } from "./AttachDocumentDialog"

const ITEMS_PER_PAGE = 5;
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

function isValidStatusMappingKey(key: string): key is StatusMappingKey {
  return key in statusMapping;
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
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAttachDocumentDialogOpen, setIsAttachDocumentDialogOpen] = useState(false);


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
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les données. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleValidate = async () => {
    setIsValidationDialogOpen(true);
  };

  const handleReject = async () => {
    setIsRejectionDialogOpen(true);
  };

  const confirmValidation = async () => {
    if (!selectedEDB) return;
    setIsValidating(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.queryId}/validate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        setIsValidating(true);
        throw new Error(errorData.message || 'Failed to validate EDB');
      }
      refetch();
      toast({
        title: "EDB Validé",
        description: `L'EDB #${selectedEDB.id} a été validé avec succès.`,
      });
      setIsValidating(false);
    } catch (error : any) {
      console.error('Error validating EDB:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation de l'EDB.",
        variant: "destructive",
      });
      setIsValidating(false);
    } finally {
      setIsValidationDialogOpen(false);
    }
  };

  const confirmRejection = async (reason: string) => {
    if (!selectedEDB) return;
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/edb/${selectedEDB.queryId}/reject`, {
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
      toast({
        title: "EDB Rejeté",
        description: `L'EDB #${selectedEDB.id} a été rejeté.`,
      });
      setIsRejecting(false);
    } catch (error : any) {
      console.error('Error rejecting EDB:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du rejet de l'EDB.",
        variant: "destructive",
      });
      setIsRejecting(false);
    } finally {
      setIsRejectionDialogOpen(false);
    }
  };

  const handleRowClick = (edb: EDB) => {
    setSelectedEDB(prevSelected => prevSelected?.id === edb.id ? null : edb);
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
    if (selectedEDB) {
      setIsAttachDocumentDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un EDB avant d'attacher des documents.",
        variant: "destructive",
      });
    }
  }, [selectedEDB]);
  const handleUploadSuccess = useCallback(async (attachments: AttachmentMetadata[]) => {
    if (!selectedEDB) return;

    try {
      // Here you would typically send the attachments data to your backend
      const response = await fetch(`/api/edb/${selectedEDB.queryId}/attachments`, {
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

      toast({
        title: "Succès",
        description: `${attachments.length} document(s) ont été attachés à l'EDB #${selectedEDB.id}.`,
      });
    } catch (error) {
      console.error('Error saving attachments:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement des documents.",
        variant: "destructive",
      });
    }
  }, [selectedEDB, refetch]);

  

  
  return (
    <>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
      <div>
          <div className="flex items-center justify-between space-y-2">
              <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins</h2>
              <div className="flex items-center space-x-2">
                <CategoriesDialog />
                <Link href="/dashboard/etats/nouveau"><Button variant="outline">Nouveau <PlusCircle className="ml-2 h-4 w-4"/></Button></Link>
              </div>
          </div>
        </div>
        <div className="grid flex-1 items-start md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            
              {/* <Card className="sm:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Dépenses Totale
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">XOF 8910222</div>
                    <p className="text-xs text-muted-foreground">
                      +20.1% sur le mois passé
                    </p>
                  </CardContent>
              </Card> */}
              <MetricCard />
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total
                  </CardTitle>
                  <PackageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">55</div>
                  <p className="text-xs text-muted-foreground">
                    +18.1% sur le mois dernier
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Actif
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+30</div>
                  <p className="text-xs text-muted-foreground">
                  +5 depuis la dernière heure
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">25</div>
                </CardContent>
              </Card>

              </div>
              <div className="flex items-center">
                {/* <RadioGroup>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="jour" id="jour" className="h-3.5 w-3.5"/>
                      <Label htmlFor="jour"><text className="lg:hidden">S</text><text className="hidden lg:block text-xs">Semaine</text></Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="mois" id="mois" className="h-3.5 w-3.5"/>
                      <Label htmlFor="mois"><text className="lg:hidden">M</text><text className="hidden lg:block text-xs">Mois</text></Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="annee" id="annee" className="h-3.5 w-3.5"/>
                      <Label htmlFor="annee"><text className="lg:hidden">A</text><text className="hidden lg:block text-xs">Année</text></Label>
                    </div>
                  </div>   
                </RadioGroup> */}
                {/* <TabsList>
                  <TabsTrigger value="week">Semaine</TabsTrigger>
                  <TabsTrigger value="month">Mois</TabsTrigger>
                  <TabsTrigger value="year">Année</TabsTrigger>
                </TabsList> */}
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
                        <TableHead className="hidden md:table-cell">
                            Statut
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            Département
                        </TableHead>
                        <TableHead className="text-right md:rounded-r-lg">
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
            <Card className="overflow-hidden lg:block hidden mb-5">
              {selectedEDB ? (
                <>
                <CardHeader className="flex flex-row items-start border-b">
                  <div className="grid gap-0.5">
                    <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
                      # {selectedEDB.id}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Copy className="h-3 w-3" onClick={() => {
                        const textToCopy = `${selectedEDB.id}`;
                        navigator.clipboard.writeText(textToCopy);
                        toast({
                          title: "Copie réussi",
                          description: `L\'ID a été copié dans le presse-papier.`,
                        })
                      }} />
                        <span className="sr-only">Copier ID EDB</span>
                      </Button>
                    </CardTitle>
                    <CardDescription>Statut: 
                      <StatusBadge status={selectedEDB.status} />
                    </CardDescription>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                        Tracker
                      </span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <MoreVertical className="h-3.5 w-3.5" />
                          <span className="sr-only">Plus</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        
                        <DropdownMenuItem onSelect={handleOpenAttachDialog}>
                          Joindre document(s)
                          <Paperclip className="ml-2 h-4 w-4" />
                        </DropdownMenuItem>
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
                    {selectedEDB && (
                      <>
                        <ValidationDialog 
                          isOpen={isValidationDialogOpen}
                          onClose={() => setIsValidationDialogOpen(false)}
                          onConfirm={confirmValidation}
                          edbId={selectedEDB.queryId}
                          isLoading={isValidating}
                        />
                        <RejectionDialog 
                          isOpen={isRejectionDialogOpen}
                          onClose={() => {
                            setIsRejectionDialogOpen(false);
                            setIsRejecting(false);
                          }}
                          onConfirm={confirmRejection}
                          edbId={selectedEDB.queryId}
                          isLoading={isRejecting}
                        />
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-sm">
                
                  <div className="grid gap-3">
                    <small className="text-xs text-muted-foreground"><b>Titre:</b> {selectedEDB.title}</small>
                    <ul className="grid gap-3">
                    <li className="flex items-center justify-between px-3">
                      <span className="font-semibold">Désignation</span>
                      <span className="font-semibold">QTE</span>
                    </li>
                    </ul>
                    <ul className="grid gap-3">
                    <ScrollArea className="w-full rounded-md h-14 p-2 border">
                      {selectedEDB.items.map((item, index) => (
                        <li className="flex items-center justify-between" key={index}>
                          <span className="text-muted-foreground">{item.designation}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      ))}
                    </ScrollArea>
                    </ul>
                    <span className="font-semibold">Références Techniques</span>
                    <span className="text-muted-foreground">Non-renseigné</span>
                    <Separator className="my-2" />
                    <ul className="grid gap-3">
                      <li className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Total - Estimé (XOF)</span>
                        <span>{selectedEDB.amount}</span>
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
                          <a href="mailto:djamilla.sylla@touba-oil.com">{selectedEDB.email}</a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Separator className="my-4" />
                    <div className="font-semibold">Document Rattaché (Service ACHAT)</div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
                      <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
                      {selectedEDB.documents.map((document, index) => (
                        <>
                         <Button variant="outline" className="text-xs"> <Paperclip className="h-4 w-4 mr-1" key={index}/>{document}</Button>
                         </>
                      ))}
                      </div>
                    
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                  <div className="text-xs text-muted-foreground">
                    Date: <time dateTime={selectedEDB.date}>{selectedEDB.date}</time>
                  </div>
                </CardFooter>
                </>
              ) : (
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un EDB pour voir les détails
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}