"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2Icon, Calendar, ChevronLeft, ChevronRight, File, FilterIcon, RefreshCwIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { SpinnerCircular } from "spinners-react";
import { toast } from "sonner";
import { ContentLayout } from "@/components/user-panel/content-layout";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BDSTableRow } from "./components/BDSTableRow";
import { BDSDetails } from "./components/BDSDetails";
import { BDSForm } from "./components/BDSForm";
import { BDSKPICards } from "./components/BDSKPICards";
import { BDS } from "./types/bds";
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

const DEPT_FILTER_ROLES = ["ADMIN", "DIRECTEUR_GENERAL", "DAF", "MAGASINIER", "GARDIEN"];

export default function BDSPage() {
  const { data: session, status } = useSession();
  const [bdsList, setBdsList] = useState<BDS[]>([]);
  const [selectedBDS, setSelectedBDS] = useState<BDS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeType, setActiveType] = useState<"PERSONNEL" | "MATERIEL">("PERSONNEL");
  const [departments, setDepartments] = useState<Department[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modalBDS, setModalBDS] = useState<BDS | null>(null);
  const [isTimeOptionSelected, setIsTimeOptionSelected] = useState(false);
  const [isDeptOptionSelected, setIsDeptOptionSelected] = useState(false);
  const [isStatusOptionSelected, setIsStatusOptionSelected] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const isGardien = session?.user?.role === "GARDIEN";
  const canCreate = !isGardien;
  const showDeptFilter = DEPT_FILTER_ROLES.includes(session?.user?.role ?? "");

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setIsTimeOptionSelected(value !== "" && value !== "this-month");
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setIsDeptOptionSelected(value !== "" && value !== "all");
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setIsStatusOptionSelected(value !== "" && value !== "all");
  };

  const handleTypeChange = (value: "PERSONNEL" | "MATERIEL") => {
    setActiveType(value);
    setPage(1);
    setSearchTerm("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setTimeRange("");
    setIsTimeOptionSelected(false);
    setIsDeptOptionSelected(false);
    setIsStatusOptionSelected(false);
  };

  useEffect(() => {
    const bdsId = searchParams.get("bdsId");
    if (bdsId && session?.user?.id) {
      const fetchBDSDetails = async () => {
        try {
          const response = await fetch(`/api/bds?id=${bdsId}`);
          if (response.ok) {
            const data = await response.json();
            setModalBDS(data);
          }
        } catch (error) {
          console.error("Error fetching BDS details:", error);
          toast.error("Erreur", { description: "Impossible de charger les détails du bon de sortie" });
        }
      };
      fetchBDSDetails();
    }
  }, [searchParams, session?.user?.id]);

  const handleCloseModal = () => {
    setModalBDS(null);
    const newURL = new URL(window.location.href);
    newURL.searchParams.delete("bdsId");
    router.replace(newURL.pathname);
  };

  useEffect(() => {
    if (session?.user?.id) {
      const fetchDepartments = async () => {
        try {
          const res = await fetch("/api/departments");
          if (res.ok) {
            const data = await res.json();
            setDepartments(data);
          }
        } catch (error) {
          console.error("Error fetching departments:", error);
        }
      };
      fetchDepartments();
    }
  }, [session?.user?.id]);

  const fetchBDS = async () => {
    setIsLoading(true);
    setSelectedBDS(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
        department: departmentFilter,
        status: statusFilter,
        type: activeType,
      });
      if (timeRange) queryParams.append("timeRange", timeRange);

      const response = await fetch(`/api/bds?${queryParams}`);
      if (!response.ok) throw new Error("Erreur réseau");

      const { data, total: totalItems } = await response.json();
      setBdsList(data || []);
      setTotal(totalItems || 0);
    } catch (error) {
      console.error("Erreur:", error);
      setBdsList([]);
      setTotal(0);
      toast.error("Erreur", { description: "Une erreur est survenue lors de la récupération des données." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchBDS();
    }
  }, [page, pageSize, searchTerm, session?.user?.id, timeRange, departmentFilter, statusFilter, activeType]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchBDS();
      setLastUpdated(new Date());
    } catch (error) {
      toast.error("Erreur", { description: "Impossible de rafraîchir les données." });
    } finally {
      setIsLoading(false);
    }
  };

  const parseFrenchDateToISO = (value: string) => {
    const parts = value?.split("/");
    if (!parts || parts.length !== 3) return value;
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const normalizeBdsPayload = (payload: any) => {
    if (payload?.date && typeof payload.date === "string" && payload.date.includes("/")) {
      return { ...payload, date: parseFrenchDateToISO(payload.date) };
    }
    return payload;
  };

  const handleBDSSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizeBdsPayload(data)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec de la création du BDS");
      }

      const result = await response.json();
      toast.success("Bon de sortie créé", {
        description: `Le bon de sortie ${result.bdsId} a été créé avec succès.`,
      });

      await fetchBDS();
    } catch (error) {
      console.error("Error creating BDS:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du bon de sortie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        page: "1",
        pageSize: "9999",
        search: searchTerm,
        department: departmentFilter,
        status: statusFilter,
        type: activeType,
      });
      if (timeRange) queryParams.append("timeRange", timeRange);

      const response = await fetch(`/api/bds?${queryParams}`);
      if (!response.ok) throw new Error("Erreur réseau");
      const { data } = await response.json();

      let exportData: Record<string, any>[];
      let sheetName: string;
      let fileName: string;
      let colWidths: { wch: number }[];

      if (activeType === "PERSONNEL") {
        sheetName = "BDS Personnel";
        fileName = `BDS_Personnel_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.xlsx`;
        colWidths = [
          { wch: 18 }, { wch: 35 }, { wch: 25 }, { wch: 14 },
          { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
          { wch: 40 }, { wch: 30 }, { wch: 25 }, { wch: 14 },
          { wch: 22 }, { wch: 22 },
        ];
        exportData = data.map((bds: any) => {
          const employees: any[] = Array.isArray(bds.employees) ? bds.employees : [];
          return {
            "Référence": bds.bdsId,
            "Motif": bds.motif,
            "Destination": bds.destination || "",
            "Date de sortie": new Date(bds.date).toLocaleDateString("fr-FR"),
            "Heure de sortie prévue": bds.heureSortie || "",
            "Heure de retour prévue": bds.heureRetour || "",
            "Heure de sortie effective": bds.heureSortieEffective || "",
            "Heure de retour effective": bds.heureRetourEffective || "",
            "Employés concernés": employees.map((e) => `${e.name} (${e.role})`).join("; "),
            "Département": bds.department?.name || "",
            "Créateur": bds.creator?.name || "",
            "Statut": {
              SUBMITTED: "Soumis",
              VALIDATED: "Validé",
              COMPLETED: "Sorti",
              RETURNED: "Retourné",
              REJECTED: "Rejeté",
            }[bds.status as string] || bds.status,
            "Validé par": bds.validator?.name || "",
            "Date de création": new Date(bds.createdAt).toLocaleDateString("fr-FR"),
          };
        });
      } else {
        sheetName = "BDS Matériel";
        fileName = `BDS_Materiel_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.xlsx`;
        colWidths = [
          { wch: 18 }, { wch: 35 }, { wch: 25 }, { wch: 14 },
          { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
          { wch: 18 }, { wch: 8 }, { wch: 55 }, { wch: 30 },
          { wch: 25 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
        ];
        exportData = data.map((bds: any) => {
          const items: any[] = Array.isArray(bds.items) ? bds.items : [];
          return {
            "Référence": bds.bdsId,
            "Motif": bds.motif,
            "Destination": bds.destination || "",
            "Date de sortie": new Date(bds.date).toLocaleDateString("fr-FR"),
            "Heure de sortie prévue": bds.heureSortie || "",
            "Heure de retour prévue": bds.heureRetour || "",
            "Heure de sortie effective": bds.heureSortieEffective || "",
            "Heure de retour effective": bds.heureRetourEffective || "",
            "Véhicule": bds.vehicule || "",
            "Chauffeur": bds.chauffeur || "",
            "Nombre de colis": bds.nombreColis ?? "",
            "Articles": items.map((i) => `${i.quantite}× ${i.designation}${i.observations ? ` (${i.observations})` : ""}`).join("; "),
            "Département": bds.department?.name || "",
            "Créateur": bds.creator?.name || "",
            "Statut": {
              SUBMITTED: "Soumis",
              VALIDATED: "Validé",
              COMPLETED: "Sorti",
              RETURNED: "Retourné",
              REJECTED: "Rejeté",
            }[bds.status as string] || bds.status,
            "Validé par": bds.validator?.name || "",
            "Date de création": new Date(bds.createdAt).toLocaleDateString("fr-FR"),
          };
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      worksheet["!cols"] = colWidths;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      toast.error("Erreur", { description: "Impossible d'exporter les données." });
    } finally {
      setIsExporting(false);
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
    <ContentLayout title="Bons de Sortie">
      <DynamicBreadcrumbs />
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-6 md:px-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-base md:text-3xl font-bold tracking-tight">Bons de Sortie</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport} disabled={isExporting || session?.user?.role === "USER"}>
              {isExporting
                ? <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                : <File className="h-3.5 w-3.5" />}
              <span className="sr-only sm:not-sr-only">Exporter</span>
            </Button>
            {canCreate && <BDSForm onSubmit={handleBDSSubmit} isLoading={isSubmitting} />}
          </div>
        </div>

        {/* Type Tabs */}
        <Tabs value={activeType} onValueChange={(v) => handleTypeChange(v as "PERSONNEL" | "MATERIEL")}>
          <TabsList>
            
            {session?.user?.role !== "USER" ? (
              <>
                <TabsTrigger value="PERSONNEL">Personnel</TabsTrigger>
                <TabsTrigger value="MATERIEL">Matériel</TabsTrigger>
              </>
            ) : (
              <TabsTrigger value="PERSONNEL">Personnel</TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        {/* KPI Cards */}
        <BDSKPICards timeRange={timeRange || "this-month"} type={activeType} />

        <div className="grid flex-1 gap-4 lg:grid-cols-3 xl:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-row items-center justify-between space-x-2">
              <Input
                placeholder="Rechercher un bon de sortie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-sm lg:max-w-sm"
              />
              <div className="flex flex-row gap-2 items-center">
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className={`w-fit h-10 ${isTimeOptionSelected ? "bg-primary text-white" : ""}`}>
                    <Calendar className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="this-week">Cette semaine</SelectItem>
                    <SelectItem value="this-month">Ce mois</SelectItem>
                    <SelectItem value="last-month">Mois dernier</SelectItem>
                    <SelectItem value="last-3-months">Trimestre</SelectItem>
                    <SelectItem value="this-year">Cette année</SelectItem>
                    <SelectItem value="last-year">Année dernière</SelectItem>
                  </SelectContent>
                </Select>

                {showDeptFilter && (
                  <Select value={departmentFilter} onValueChange={handleDepartmentFilterChange}>
                    <SelectTrigger className={`w-fit h-10 ${isDeptOptionSelected ? "bg-primary text-white" : ""}`}>
                      <Building2Icon className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Départements</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className={`w-fit h-10 ${isStatusOptionSelected ? "bg-primary text-white" : ""}`}>
                    <FilterIcon className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="SUBMITTED">Soumis</SelectItem>
                    <SelectItem value="VALIDATED">Validé</SelectItem>
                    <SelectItem value="COMPLETED">Sorti</SelectItem>
                    <SelectItem value="RETURNED">Retourné</SelectItem>
                    <SelectItem value="REJECTED">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="pt-5 p-1 md:p-4">
                <Table>
                  <TableHeader className="bg-muted rounded-lg">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead className="sm:table-cell">Motif</TableHead>
                      <TableHead className="hidden sm:table-cell">Département</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
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
                    ) : bdsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Aucun bon de sortie trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bdsList.map((bds) => (
                        <BDSTableRow
                          key={bds.id}
                          bds={bds}
                          onClick={() => setSelectedBDS(bds)}
                          isSelected={selectedBDS?.id === bds.id}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex items-end justify-between border-t bg-muted/50 p-4">
                <div className="flex flex-row items-center gap-1 text-xs text-muted-foreground w-full">
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCwIcon className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    <span className="sr-only">Rafraîchir</span>
                  </Button>
                  <div className="hidden md:block">{lastUpdated.toLocaleString()}</div>
                </div>
                <Pagination className="flex items-end justify-end">
                  <PaginationContent className="flex items-center gap-2">
                    <PaginationItem>
                      <Button size="icon" variant="outline" className="h-6 w-6 hidden md:flex" onClick={() => setPage(1)} disabled={page === 1 || isLoading}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <ChevronLeft className="h-3.5 w-3.5 -ml-2" />
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                    </PaginationItem>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-sm text-muted-foreground hidden md:inline">Page</span>
                      <Input
                        type="number"
                        min={1}
                        max={Math.ceil(total / pageSize)}
                        value={page}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= Math.ceil(total / pageSize)) setPage(value);
                        }}
                        className="h-6 w-20 text-xs"
                      />
                      <span className="text-sm text-muted-foreground hidden md:inline">sur {Math.ceil(total / pageSize)}</span>
                    </div>
                    <PaginationItem>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page >= Math.ceil(total / pageSize) || isLoading}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button size="icon" variant="outline" className="h-6 w-6 hidden md:flex" onClick={() => setPage(Math.ceil(total / pageSize))} disabled={page === Math.ceil(total / pageSize) || isLoading}>
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
            {selectedBDS ? (
              <BDSDetails bds={selectedBDS} onRefresh={fetchBDS} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un bon de sortie pour en afficher les détails
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={!!modalBDS} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto px-8 p-2">
            {modalBDS && (
              <BDSDetails
                bds={modalBDS}
                onRefresh={async () => {
                  await fetchBDS();
                  setLastUpdated(new Date());
                  const response = await fetch(`/api/bds?id=${modalBDS.bdsId}`);
                  if (response.ok) {
                    const data = await response.json();
                    setModalBDS(data);
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
