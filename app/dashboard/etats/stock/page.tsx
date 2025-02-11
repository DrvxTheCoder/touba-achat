// app/dashboard/etats/stock/page.tsx
"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ChevronLeft, ChevronRight, FilterIcon, LayoutListIcon, ListFilter, Package2, RefreshCwIcon, TagIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SpinnerCircular } from "spinners-react";
import { StockEDBTableRow } from "./components/StockEDBTableRow";
import { StockEDBDetails } from "./components/StockEDBDetails";
import { CategoryType } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StockEdbDialog from "../components/StockEDBForm";
import { ContentLayout } from "@/components/user-panel/content-layout";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";
import ResponsiveStockEdbDialog from "../components/ResponsiveStockEDBForm";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { PrintTest } from "@/components/PrintBDCButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Category = {
    id: number;
    name: string;
    type: CategoryType;
  }
  
  type Department = {
    id: number;
    name: string;
  }

const UnauthorizedContent = ({ message }: { message: string }) => (
  <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <div className="flex items-center">
      <h1 className="text-lg font-semibold md:text-2xl">Non-autorisé</h1>
    </div>
    <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Accès interdit
        </h3>
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/acceuil">Retourner à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  </main>
);

const LoadingContent = () => (
  <ContentLayout title="Chargement...">
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  </ContentLayout>
);

const testData = {
  edbId: "BDC2024001",
  date: new Date().toLocaleDateString('fr-FR'),
  username: "Keba Gnabaly",
  department: "Direction Opération Gaz",
  items: [
    {
      description: "Cartouche d'encre HP",
      quantity: 2,
      unitPrice: 15000,
      total: 30000
    },
    {
      description: "Papier A4",
      quantity: 5,
      unitPrice: 2500,
      total: 12500
    }
  ],
  total: 42500,
  approvedBy: "Daouda Badji",
  approvedDAF: "Safietou Ndour",
  cashier: "Rokhaya Thiam"
};

export default function StockEDBPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stockEdbs, setStockEdbs] = useState<any[]>([]);
    const [selectedEDB, setSelectedEDB] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(5);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [timeRange, setTimeRange] = useState('this-month');
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isTimeOptionSelected, setIsTimeOptionSelected] = useState(false);
    const [isCatOptionSelected, setIsCatOptionSelected] = useState(false);
    const [isStatusOptionSelected, setIsStatusOptionSelected] = useState(false);

  // Check if user has required role
  const hasAccess = session?.user?.role && ['ADMIN', 'MAGASINIER', 'DIRECTEUR_GENERAL'].includes(session.user.role);

    const handleTimeRangeChange = (value: React.SetStateAction<string>) => {
      setTimeRange(value);
      setIsTimeOptionSelected(value !== '' && value !== 'this-month');
    };
  
    const handleCategoryFilterChange = (value: React.SetStateAction<string>) => {
      setCategoryFilter(value);
      setIsCatOptionSelected(value !== '' && value !== 'all');
    };
  
    const handleStatusFilterChange = (value: React.SetStateAction<string>) => {
      setStatusFilter(value);
      setIsStatusOptionSelected(value !== '' && value !== 'ALL');
    }

  useEffect(() => {
    if (!hasAccess) return;

    const fetchInitialData = async () => {
      try {
        const [categoriesRes, departmentsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/departments')
        ]);
        
        if (categoriesRes.ok && departmentsRes.ok) {
          const [categoriesData, departmentsData] = await Promise.all([
            categoriesRes.json(),
            departmentsRes.json()
          ]);
          
          setCategories(categoriesData);
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [hasAccess]);

  const fetchStockEDBs = async () => {
    setIsLoading(true);
    setSelectedEDB(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
        category: categoryFilter,
        timeRange: timeRange,
        status: statusFilter,
      });

      const response = await fetch(`/api/edb/stock?${queryParams}`);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const { data, total: totalItems } = await response.json();
      setStockEdbs(data || []);
      setTotal(totalItems || 0);
      setTotalPages(Math.ceil(totalItems / pageSize));
    } catch (error) {
      console.error("Erreur:", error);
      setStockEdbs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchStockEDBs();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error("Erreur",{
        description: "Impossible de rafraîchir les données. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (!hasAccess) return;
    fetchStockEDBs();
  }, [hasAccess, page, searchTerm, categoryFilter, timeRange, statusFilter]);

  const handleStockEdbSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/edb/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create stock EDB');

      const result = await response.json();
      toast.success("Demande stock créée", {
        description: `La demande ${result.edbId} a été créée avec succès.`,
      });

      // Refresh the list
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
        category: categoryFilter,
      });
      
      const refreshResponse = await fetch(`/api/edb/stock?${queryParams}`);
      if (refreshResponse.ok) {
        const { data, total: totalItems } = await refreshResponse.json();
        setStockEdbs(data || []);
        setTotal(totalItems || 0);
      }
    } catch (error) {
      console.error('Error creating stock EDB:', error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la création de la demande stock.",
      });
    }
  };

  if (status === "loading") {
      return <LoadingContent />;
  }

  if (!session) {
    return (
      <ContentLayout title="Non-autorisé">
        <UnauthorizedContent message="Veuillez vous connecter pour accéder à cette page." />
      </ContentLayout>
    );
  }

  if (!hasAccess) {
    return (
      <ContentLayout title="Non-autorisé">
        <UnauthorizedContent message="Vous n'avez pas les permissions nécessaires pour accéder à ce contenu." />
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Articles en Stock">
      <DynamicBreadcrumbs />
      <main className="flex flex-1 flex-col gap-4 p-4 pb-20 md:px-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins (Stock)</h2>
        <div className="flex items-center space-x-2">
          <TooltipProvider disableHoverableContent>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
              <Link href="/dashboard/etats"><Button variant="outline" size={'icon'}> <OpenInNewWindowIcon className="h-4 w-4"/></Button></Link>
                </TooltipTrigger>
              <TooltipContent side="bottom">
                  EDBs Standard
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        <StockEdbDialog 
            categories={categories}
            departments={departments}
            onSubmit={handleStockEdbSubmit}
          />
        </div>
        
      </div>
        

        <div className="grid flex-1 gap-4 lg:grid-cols-3 xl:grid-cols-3">
          <div className="lg:col-span-2 md:col-span-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Input 
                  placeholder="Recherche..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-sm lg:max-w-sm"
                />
              <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className={`w-fit h-10 ${isTimeOptionSelected ? 'bg-primary text-white' : ''}`}>
                <Calendar className="h-4 w-4" />
                  {/* <SelectValue placeholder="Période" className="hidden" /> */}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">Ce mois</SelectItem>
                  <SelectItem value="last-month">Mois dernier</SelectItem>
                  <SelectItem value="last-3-months">Trimestre</SelectItem>
                  <SelectItem value="this-year">Cette année</SelectItem>
                  <SelectItem value="last-year">Année dernière</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className={`w-fit h-10 ${isStatusOptionSelected ? 'bg-primary text-white' : ''}`}>
                <FilterIcon className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="SUBMITTED">Soumis</SelectItem>
                  <SelectItem value="DELIVERED">Livré</SelectItem>
                  <SelectItem value="PARTIALLY_DELIVERED">Livré (Reste manquant)</SelectItem>
                  <SelectItem value="CONVERTED">Converti</SelectItem>
                </SelectContent>
              </Select>
                <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                  <SelectTrigger className={`w-fit h-10 ${isCatOptionSelected ? 'bg-primary text-white' : ''}`}>
                  <TagIcon className="h-4 w-4" />
                    {/* <SelectValue placeholder="Catégories" /> */}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Toute les catégorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.id}
                        value={category.id.toString()}
                        onSelect={() => setCategoryFilter(category.id.toString())}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card className="rounded-2xl">
              <CardContent className="pt-5 p-1 md:p-4">
                <Table>
                <TableHeader className="bg-muted">
                    <TableRow className="rounded-lg border-0">
                    <TableHead className="rounded-l-lg">
                    ID
                    </TableHead>
                    <TableHead className=" sm:table-cell">
                    Statut
                    </TableHead>
                    <TableHead className="hidden md:table-cell md:text-left">
                    Catégorie
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                    Articles
                    </TableHead>
                    <TableHead className="hidden md:table-cell md:rounded-r-lg">
                    Date
                    </TableHead>
                    <TableHead className="md:hidden table-cell text-right rounded-r-lg">
                    
                    </TableHead>
                    </TableRow>
                </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex justify-center items-center h-24">
                            <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : stockEdbs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Aucun article en stock trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockEdbs.map((stockEdb) => {
                        console.log("Mapping stockEdb:", stockEdb); // Add this log
                        return (
                          <StockEDBTableRow
                            key={stockEdb.id}
                            stockEdb={stockEdb}
                            onClick={() => setSelectedEDB(stockEdb)}
                            isSelected={selectedEDB?.id === stockEdb.id}
                          />
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex items-end justify-end border-t bg-muted/50 p-4 rounded-bl-2xl rounded-br-2xl">
              <div className="flex flex-row items-center gap-1 text-xs text-muted-foreground w-full">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-6 w-6" 
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCwIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="sr-only">Rafraîchir</span>
                    </Button>
                    <div className="hidden md:block">
                        {lastUpdated.toLocaleString()}
                    </div>
                  </div>
                <div className="text-xs text-muted-foreground">
                  {/* Mis à jour: {format(new Date(), "dd/MM/yyyy", { locale: fr })} */}
                </div>
                <Pagination className="flex flex-row justify-end gap-2">
                  <PaginationContent className="flex items-center gap-2">
                    {/* First page */}
                    <PaginationItem className="hidden md:block">
                      <Button
                        size="icon"  
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => setPage(1)}
                        disabled={page === 1 || isLoading}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <ChevronLeft className="h-3.5 w-3.5 -ml-2" />
                      </Button>
                    </PaginationItem>

                    {/* Previous */}
                    <PaginationItem>
                      <Button
                        size="icon"
                        variant="outline" 
                        className="h-6 w-6"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                    </PaginationItem>

                    {/* Page input */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="hidden md:block">Page</span>
                      <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={page}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= totalPages) {
                            setPage(value);
                          }
                        }}
                        className="h-6 w-12 text-xs"
                      />
                      <span className="w-fit flex flex-row items-center"> / {totalPages}</span>
                    </div>

                    {/* Next */}
                    <PaginationItem>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </PaginationItem>

                    {/* Last page */}
                    <PaginationItem className="hidden md:block">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages || isLoading}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        <ChevronRight className="h-3.5 w-3.5 -ml-2" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
            </Card>
          </div>

          <div>
            {selectedEDB ? (
              <StockEDBDetails stockEdb={selectedEDB} onUpdate={fetchStockEDBs} />
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un article pour en afficher les détails
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </ContentLayout>

  );
}