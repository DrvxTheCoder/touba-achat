"use client"

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { SpinnerCircular } from "spinners-react";
import { toast } from "sonner";
import { ContentLayout } from "@/components/user-panel/content-layout";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";
import { BDCTableRow } from "./components/BDCTableRow";
import { BDCDetails } from "./components/BDCDetails";
import { BDCForm } from "./components/BDCForm";
import { BDC } from "./types/bdc";
import { cn } from "@/lib/utils";
import { PrinterTest } from "@/components/PrinterTest";

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

export default function BDCPage() {
  const { data: session, status } = useSession();
  const [bdcs, setBdcs] = useState<BDC[]>([]);
  const [selectedBDC, setSelectedBDC] = useState<BDC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const fetchBDCs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
      });
   
      const response = await fetch(`/api/bdc?${queryParams}`);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const { data, total: totalItems } = await response.json();
      setBdcs(data || []);
      setTotal(totalItems || 0);
    } catch (error) {
      console.error("Erreur:", error);
      setBdcs([]);
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
      fetchBDCs();
    }
  }, [page, pageSize, searchTerm, session?.user?.id]);

  const handleBDCSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bdc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec de la création du BDC');
      }

      const result = await response.json();
      toast.success("Bon de caisse créé", {
        description: `Le bon de caisse ${result.bdcId} a été créé avec succès.`,
      });

      await fetchBDCs();
      
    } catch (error) {
      console.error('Error creating BDC:', error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du bon de caisse.",
      });
    } finally {
        setIsSubmitting(false);
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
    <ContentLayout title="Bons de Caisse">
      <DynamicBreadcrumbs />
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-6 md:px-4">
        <h2 className="text-lg md:text-3xl font-bold tracking-tight">Bons de Caisse</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Rechercher un bon de caisse..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-sm lg:max-w-sm"
            />
          </div>
          <BDCForm onSubmit={handleBDCSubmit} isLoading={isSubmitting} />
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-3 xl:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <Card>
              <CardContent className="pt-5">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead className="sm:table-cell">Titre</TableHead>
                      <TableHead className="hidden sm:table-cell">Département</TableHead>
                      <TableHead className="hidden sm:table-cell">Montant</TableHead>
                      <TableHead className="sm:table-cell text-right">Statut</TableHead>
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
                    ) : bdcs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Aucun bon de caisse trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bdcs.map((bdc) => (
                        <BDCTableRow
                          key={bdc.id}
                          bdc={bdc}
                          onClick={() => setSelectedBDC(bdc)}
                          isSelected={selectedBDC?.id === bdc.id}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex items-end justify-between border-t bg-muted/50 p-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => fetchBDCs()}
                disabled={isLoading}
            >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
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
            <PrinterTest />
          </div>

          <div>
            {selectedBDC ? (
              <BDCDetails bdc={selectedBDC} onRefresh={fetchBDCs} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un bon de caisse pour en afficher les détails
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
      </main>
    </ContentLayout>
  );
}