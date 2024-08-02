"use client"
//etats-de-besoin/page.tsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ContentLayout } from "@/components/user-panel/content-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { EDBTimelineDialog } from "@/components/EDBTimelineDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EDBTableRow } from "./components/EDBTableRow";
import { EDBDetailsCard } from "./components/EDBDetailsCard";
import { SpinnerCircular } from "spinners-react";
import { EDB } from "./data/types";


export default function EtatsDeBesoinPage() {
  const [edbs, setEdbs] = useState<EDB[]>([]);
  const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  

  useEffect(() => {
    const fetchEDBs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/edb/user?page=${page}&pageSize=${pageSize}&search=${searchTerm}&status=${statusFilter}`);
        if (!response.ok) {
          throw new Error('Erreur réseau lors de la récupération des EDBs');
        }
        const data = await response.json();
        setEdbs(data.data);
        setTotal(data.total);
      } catch (error) {
        console.error("Erreur lors de la récupération des EDPs:", error);
        // You can add a user notification here
      } finally {
        setIsLoading(false);
      }
    };

    fetchEDBs();
  }, [page, pageSize, searchTerm, statusFilter]);

  const handleRowClick = (edb: EDB) => {
    setSelectedEDB(edb);
  };

  return (
    <ContentLayout title="Etats de Besoins">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/acceuil">Accueil</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Etats de Besoins</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-3xl font-bold tracking-tight">Mes états de besoins</h2>
          <Link href="/etats-de-besoin/nouveau">
            <Button>
              Nouveau <PlusCircle className="ml-2 h-4 w-4"/>
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Input 
            placeholder="Recherche..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-sm lg:max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                <ListFilter className="mr-2 h-4 w-4" />
                Filtrer par statut
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setStatusFilter("")}>Tous</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatusFilter("DRAFT")}>Brouillon</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatusFilter("SUBMITTED")}>Soumis</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatusFilter("APPROVED_RESPONSABLE,APPROVED_DIRECTEUR,APPROVED_DG")}>Approuvé</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatusFilter("REJECTED")}>Rejeté</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid flex-1 items-start gap-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-3 mb-10">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
            <Card>
              <CardContent className="pt-5">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="rounded-lg border-0">
                      <TableHead className="rounded-l-lg">ID</TableHead>
                      <TableHead className="hidden sm:table-cell">Titre</TableHead>
                      <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                      <TableHead className="rounded-r-lg md:rounded-none text-right md:text-left">Statut</TableHead>
                      <TableHead className="hidden sm:table-cell text-right rounded-r-lg">Montant (XOF)</TableHead>
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
                    ) : edbs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Aucun état de besoin trouvé.</TableCell>
                      </TableRow>
                    ) : (
                      edbs.map((edb) => (
                        <EDBTableRow key={edb.id} edb={edb} onClick={() => setSelectedEDB(edb)} isSelected={selectedEDB?.id === edb.id} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                <div className="text-xs text-muted-foreground">
                  Mis à jour: <time dateTime={new Date().toISOString()}>{new Date().toLocaleDateString('fr-FR')}</time>
                </div>
                <Pagination className="ml-auto mr-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
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
                        onClick={() => setPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))}
                        disabled={page === Math.ceil(total / pageSize)}
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
          <div>
            {selectedEDB ? 
            (<EDBDetailsCard 
              edb={{
                ...selectedEDB,
                auditLogs: selectedEDB.auditLogs // Make sure this data is fetched and available
              }} 
            />) : (
              <Card>
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un EDB pour en afficher les détails
                </CardContent>
              </Card>
            )} 
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}