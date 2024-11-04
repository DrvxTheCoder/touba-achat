"use client"

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SpinnerCircular } from "spinners-react";
import { StockEDBTableRow } from "@/app/dashboard/etats/stock/components/StockEDBTableRow";
import { UserStockEDBDetails } from "./components/UserStockEDBDetails";
import { CategoryType } from "@prisma/client";
import { toast } from "sonner";
import UserStockEdbForm from "./components/UserStockEDBForm";
import { ContentLayout } from "@/components/user-panel/content-layout";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";
import { StockEDB } from "@/app/dashboard/etats/stock/types/stock-edb";

// Define proper types

type Category = {
  id: number;
  name: string;
  type: CategoryType;
};

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

export default function UserStockEDBPage() {
  const { data: session, status } = useSession();
  const [stockEdbs, setStockEdbs] = useState<StockEDB[]>([]);
  const [selectedEDB, setSelectedEDB] = useState<StockEDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchStockEDBs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
      });
  
      const response = await fetch(`/api/edb/stock/user?${queryParams}`);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const { data, total: totalItems } = await response.json();
      setStockEdbs(data || []);
      setTotal(totalItems || 0);
    } catch (error) {
      console.error("Erreur:", error);
      setStockEdbs([]);
      setTotal(0);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la récupération des données."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchStockEDBs();
    }
  }, [page, pageSize, searchTerm, session?.user?.id]);

  const handleStockEdbSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/edb/stock/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create stock EDB');
      }

      const result = await response.json();
      toast.success("Demande stock créée", {
        description: `La demande ${result.edbId} a été créée avec succès.`,
      });

      // Refresh the list
      await fetchStockEDBs();
      
    } catch (error) {
      console.error('Error creating stock EDB:', error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de la demande stock.",
      });
    }
  };

  if (status === "loading") {
    return <LoadingContent />;
  }

  if (!session) {
    return (
      <ContentLayout title="Non-autorisé">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p>Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Mes Demandes Stock">
      <DynamicBreadcrumbs />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8">
      <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins (Stock)</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Rechercher un article..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-sm lg:max-w-sm"
            />
          </div>
          <UserStockEdbForm 
            categories={categories}
            onSubmit={handleStockEdbSubmit}
          />
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-3 xl:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-5">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead className="hidden sm:table-cell">Employé</TableHead>
                      <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                      <TableHead className="hidden sm:table-cell">Quantité</TableHead>
                      <TableHead className="hidden sm:table-cell text-right">Date</TableHead>
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
              <UserStockEDBDetails stockEdb={selectedEDB} />
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