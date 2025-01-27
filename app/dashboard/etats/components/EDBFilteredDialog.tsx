// components/EDBFilteredDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EDBTableRow } from "../data/EDBTableRow";
import { ChevronLeft, ChevronRight, RefreshCwIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SpinnerCircular } from "spinners-react";
import { EDB } from "@/app/(utilisateur)/etats-de-besoin/data/types";
import { useSession } from "next-auth/react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 5;

interface FilteredDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: 'all' | 'active' | 'pending';
  timeRange: string;
  title: string;
}

export function FilteredEDBDialog({
  isOpen,
  onOpenChange,
  filterType,
  timeRange,
  title
}: FilteredDialogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null);
  const [data, setData] = useState<{
    edbs: EDB[];
    totalCount: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const statusMap = {
    all: [],
    active: ['APPROVED_DIRECTEUR', 'APPROVED_DG', 'MAGASINIER_ATTACHED', 'SUPPLIER_CHOSEN', 'COMPLETED', 'FINAL_APPROVAL'],
    pending: ['SUBMITTED', 'ESCALATED', 'APPROVED_RESPONSABLE']
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = statusMap[filterType].join(',');
      const response = await fetch(
        `/api/edb?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}&timeRange=${timeRange}${status ? `&status=${status}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, timeRange, filterType]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader className="bg-muted mb-1">
                <TableRow className="rounded-lg border-0">
                  <TableHead className="rounded-l-lg">ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                  <TableHead className="text-right md:text-left">Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Département</TableHead>
                  <TableHead className="hidden md:table-cell md:rounded-r-lg">Montant (XOF)</TableHead>
                  <TableHead className="lg:hidden rounded-r-lg">{''}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center h-24">
                        <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : data?.edbs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Aucun EDB trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.edbs.map((edb) => (
                    <EDBTableRow
                      key={edb.id}
                      edb={edb}
                      onRowClick={(edb) => setSelectedEDB(edb)}
                      isSelected={selectedEDB?.id === edb.id}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
            <div className="flex flex-row items-center gap-1 text-xs text-muted-foreground w-full">
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
              <div className="hidden md:block">
                {lastUpdated.toLocaleString()}
              </div>
            </div>
            <Pagination className="flex flex-row justify-end gap-2">
              <PaginationContent className="flex items-center gap-2">
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-sm text-muted-foreground hidden md:inline">Page</span>
                  <Input
                    type="number"
                    min={1}
                    max={data?.totalPages || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= (data?.totalPages || 1)) {
                        setCurrentPage(value);
                      }
                    }}
                    className="h-6 w-12 text-xs"
                  />
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    sur {data?.totalPages || 1}
                  </span>
                </div>

                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => setCurrentPage(p => Math.min(data?.totalPages || 1, p + 1))}
                    disabled={currentPage === data?.totalPages || isLoading}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}