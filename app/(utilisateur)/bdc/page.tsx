"use client"

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, RefreshCwIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { SpinnerCircular } from "spinners-react";
import { toast } from "sonner";
import { ContentLayout } from "@/components/user-panel/content-layout";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BDCTableRow } from "./components/BDCTableRow";
import { BDCDetails } from "./components/BDCDetails";
import { BDCForm } from "./components/BDCForm";
import { BDC } from "./types/bdc";
import { cn } from "@/lib/utils";
import { PrinterTest } from "@/components/PrinterTest";
import { Department } from "@prisma/client";

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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState('this-month');
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);

  // Add the departments fetch in the useEffect
  useEffect(() => {
    if (session?.user?.id) {
      const fetchInitialData = async () => {
        try {
          const departmentsRes = await fetch('/api/departments');
          
          if (departmentsRes.ok) {
            const departmentsData = await departmentsRes.json();
            setDepartments(departmentsData);
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
        }
      };

      fetchInitialData();
    }
  }, [session?.user?.id]);
  

  const fetchBDCs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
        timeRange,
        department: departmentFilter,
        status: statusFilter,
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

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchBDCs();
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
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Ce mois</SelectItem>
                <SelectItem value="last-month">Mois dernier</SelectItem>
                <SelectItem value="last-3-months">Trimestre</SelectItem>
                <SelectItem value="this-year">Cette année</SelectItem>
                <SelectItem value="last-year">Année dernière</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="space-x-1">
                <SelectValue placeholder="Départements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments.map((department) => (
                  <SelectItem 
                    key={department.id}
                    value={department.id.toString()}
                  >
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="space-x-1">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="SUBMITTED">Soumis</SelectItem>
                <SelectItem value="APPROVED">Approuvé</SelectItem>
                <SelectItem value="APPROVED_DAF">Approuvé DAF</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
                <SelectItem value="PRINTED">Imprimé</SelectItem>
              </SelectContent>
            </Select>
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
              <Pagination className="flex items-end justify-end">
                <PaginationContent className="flex items-center gap-2">
                  {/* First page */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 hidden md:flex"
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
                    <span className="text-sm text-muted-foreground hidden md:inline">Page</span>
                    <Input
                      type="number"
                      min={1}
                      max={Math.ceil(total / pageSize)}
                      value={page}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= Math.ceil(total / pageSize)) {
                          setPage(value);
                        }
                      }}
                      className="h-6 w-12 text-xs"
                    />
                    <span className="text-sm text-muted-foreground hidden md:inline">
                      sur {Math.ceil(total / pageSize)}
                    </span>
                  </div>

                  {/* Next */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
                      disabled={page >= Math.ceil(total / pageSize) || isLoading}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </PaginationItem>

                  {/* Last page */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 hidden md:flex"
                      onClick={() => setPage(Math.ceil(total / pageSize))}
                      disabled={page === Math.ceil(total / pageSize) || isLoading}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      <ChevronRight className="h-3.5 w-3.5 -ml-2" />
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