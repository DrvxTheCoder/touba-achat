"use client"

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2Icon, Calendar, ChevronLeft, ChevronRight, FilterIcon, RefreshCw, RefreshCwIcon } from "lucide-react";
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
import { Department } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const [timeRange, setTimeRange] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modalBDC, setModalBDC] = useState<BDC | null>(null);
  const [isTimeOptionSelected, setIsTimeOptionSelected] = useState(false);
  const [isDeptOptionSelected, setIsDeptOptionSelected] = useState(false);
  const [isStatusOptionSelected, setIsStatusOptionSelected] = useState(false);

  const allowedRoles = [
    "ADMIN",
    "DIRECTEUR_GENERAL",
    "DAF",
    "MAGASINIER",
  ];

  const handleTimeRangeChange = (value: React.SetStateAction<string>) => {
    setTimeRange(value);
    setIsTimeOptionSelected(value !== '' && value !== 'this-month');
  };

  const handleDepartmentFilterChange = (value: React.SetStateAction<string>) => {
    setDepartmentFilter(value);
    setIsDeptOptionSelected(value !== '' && value !== 'all');
  };

  const handleStatusFilterChange = (value: React.SetStateAction<string>) => {
    setStatusFilter(value);
    setIsStatusOptionSelected(value !== '' && value !== 'all');
  }


  useEffect(() => {
    const bdcId = searchParams.get('bdcId');
    if (bdcId && session?.user?.id) {
      const fetchBDCDetails = async () => {
        try {
          const response = await fetch(`/api/bdc?id=${bdcId}`);
          if (response.ok) {
            const data = await response.json();
            setModalBDC(data);
          }
        } catch (error) {
          console.error('Error fetching BDC details:', error);
          toast.error("Erreur", {
            description: "Impossible de charger les détails du bon de caisse"
          });
        }
      };
      fetchBDCDetails();
    }
  }, [searchParams, session?.user?.id]);

  const handleCloseModal = () => {
    setModalBDC(null);
    // Remove the bdcId parameter from URL
    const newURL = new URL(window.location.href);
    newURL.searchParams.delete('bdcId');
    router.replace(newURL.pathname);
  };

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
    setSelectedBDC(null);
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
      setSelectedBDC(null);
      fetchBDCs();
    }
  }, [
    page, 
    pageSize, 
    searchTerm, 
    session?.user?.id,
    timeRange,
    departmentFilter,
    statusFilter
  ]);

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
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-base md:text-3xl font-bold tracking-tight">Bons de Caisse</h2>
        <BDCForm onSubmit={handleBDCSubmit} isLoading={isSubmitting} />
      </div>
      <div className="grid flex-1 gap-4 lg:grid-cols-3 xl:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
        <div className="flex flex-row items-center justify-between space-x-2">
          <Input 
            placeholder="Rechercher un bon de caisse..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-sm lg:max-w-sm"
          />
          <div className="flex flex-row gap-2 items-center">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className={`w-fit h-10 ${isTimeOptionSelected ? 'bg-primary text-white' : ''}`}>
              <Calendar className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourdhui</SelectItem>
              <SelectItem value="this-week">Cette semaine</SelectItem>
              <SelectItem value="this-month">Ce mois</SelectItem>
              <SelectItem value="last-month">Mois dernier</SelectItem>
              <SelectItem value="last-3-months">Trimestre</SelectItem>
              <SelectItem value="this-year">Cette année</SelectItem>
              <SelectItem value="last-year">Année dernière</SelectItem>
            </SelectContent>
          </Select>
          {allowedRoles.includes(session.user.role) && (
            <Select value={departmentFilter} onValueChange={handleDepartmentFilterChange}>
              <SelectTrigger className={`w-fit h-10 ${isDeptOptionSelected ? 'bg-primary text-white' : ''}`}>
                <Building2Icon className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Départements</SelectItem>
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
          )}


          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className={`w-fit h-10 ${isStatusOptionSelected ? 'bg-primary text-white' : ''}`}>
              <FilterIcon className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout les statuts</SelectItem>
              <SelectItem value="SUBMITTED">Soumis</SelectItem>
              <SelectItem value="APPROVED_DIRECTEUR">Approuvé</SelectItem>
              <SelectItem value="APPROVED_DAF">Approuvé DAF</SelectItem>
              <SelectItem value="REJECTED">Rejeté</SelectItem>
              <SelectItem value="PRINTED">Décaissé</SelectItem>
            </SelectContent>
          </Select>
          </div>

        </div>
          <Card>
            <CardContent className="pt-5 p-1 md:p-4">
              <Table>
                <TableHeader className="bg-muted rounded-lg">
                  <TableRow className="rounded-lg">
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
                    className="h-6 w-20 text-xs"
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
      <Dialog 
        open={!!modalBDC} 
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8">
          {modalBDC && (
            <BDCDetails 
              bdc={modalBDC}
              onRefresh={async () => {
                await fetchBDCs();
                setLastUpdated(new Date());
                setModalBDC(null);
                // Also refresh the modal data
                const response = await fetch(`/api/bdc?id=${modalBDC.id}`);
                if (response.ok) {
                  const data = await response.json();
                  setModalBDC(data);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </main>
    </ContentLayout>
  );
}