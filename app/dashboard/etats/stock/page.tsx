// app/dashboard/etats/stock/page.tsx
"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
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

export default function StockEDBPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stockEdbs, setStockEdbs] = useState<any[]>([]);
    const [selectedEDB, setSelectedEDB] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(5);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

  // Check if user has required role
  const hasAccess = session?.user?.role && ['ADMIN', 'MAGASINIER', 'DIRECTEUR_GENERAL'].includes(session.user.role);

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

  useEffect(() => {
    if (!hasAccess) return;

    const fetchStockEDBs = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: searchTerm,
          category: categoryFilter,
        });
  
        const response = await fetch(`/api/edb/stock?${queryParams}`);
        if (!response.ok) throw new Error('Erreur réseau');
        
        const { data, total: totalItems } = await response.json();
        setStockEdbs(data || []);
        setTotal(totalItems || 0);
      } catch (error) {
        console.error("Erreur:", error);
        setStockEdbs([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchStockEDBs();
  }, [page, pageSize, searchTerm, categoryFilter, hasAccess]);

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
        <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins (Stock)</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Rechercher un article..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-sm lg:max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10">
                  <ListFilter className="h-4 w-4" />
                  <text className="hidden md:block mr-2">Catégories</text>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setCategoryFilter("")}>
                  Toutes les catégories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id}
                    onSelect={() => setCategoryFilter(category.id.toString())}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ResponsiveStockEdbDialog 
            categories={categories}
            departments={departments}
            onSubmit={handleStockEdbSubmit}
          />
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-3 xl:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-5">
                <Table>
                  <TableHeader className="bg-muted rounded-lg">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead className="sm:table-cell">Employé</TableHead>
                      <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                      <TableHead className="hidden sm:table-cell">Quantité</TableHead>
                      <TableHead className="sm:table-cell text-right rounded-l-md">Date</TableHead>
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
              <CardFooter className="flex items-end justify-end border-t bg-muted/50 p-4">
                <div className="text-xs text-muted-foreground">
                  {/* Mis à jour: {format(new Date(), "dd/MM/yyyy", { locale: fr })} */}
                </div>
                <Pagination className="flex items-end justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                        disabled={page >= Math.ceil(total / pageSize)}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
            </Card>
          </div>

          <div>
            {selectedEDB ? (
              <StockEDBDetails stockEdb={selectedEDB} />
            ) : (
              <Card>
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