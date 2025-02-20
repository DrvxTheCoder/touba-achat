// odm/components/table/ODMDataTable.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ListFilter, File, RefreshCwIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { ODMTableRow } from './ODMTableRow';
import useDebounce from '@/hooks/use-debounce';
import { SpinnerCircular } from 'spinners-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { translateStatus } from '@/app/utils/translate-status';
import { toast } from 'sonner';


interface ODM {
  odmId: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  totalCost?: number;
  createdAt: string;
  creator: {
    name: string,
    email: string,
} 
}

interface ODMDataTableProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export const ODMDataTable: React.FC<ODMDataTableProps> = ({ 
  timeRange, 
  onTimeRangeChange 
}) => {
  const [odms, setOdms] = useState<ODM[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

  useEffect(() => {
      fetchODMs();
  }, [page, debouncedSearchTerm, timeRange]);

  const fetchODMs = async () => {
      setLoading(true);
      try {
          const response = await fetch(`/api/odm?page=${page}&limit=5&search=${debouncedSearchTerm}&timeRange=${timeRange}`);
          if (!response.ok) {
              throw new Error('Failed to fetch ODMs');
          }
          const data = await response.json();
          setOdms(data.odms);
          setTotalPages(data.pagination.pages);
      } catch (error) {
          console.error('Error fetching ODMs:', error);
      } finally {
          setLoading(false);
      }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchODMs();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error("Erreur",{
        description: "Impossible de rafraîchir les données. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = odms.map(odm => ({
        'ID': odm.odmId,
        'Titre': odm.title,
        'Date': odm.createdAt,
        'Auteur': odm.creator.name,
        'Statut': translateStatus(odm.status),
        'Période': `${formatDate(odm.startDate)} au ${formatDate(odm.endDate)}`,
        'Frais': odm.totalCost ? `${odm.totalCost.toLocaleString('fr-FR')} XOF` : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ODMs");

    // Adjust column widths
    const colWidths = [
        { wch: 15 },  // ID
        { wch: 40 },  // Titre
        { wch: 15 },  // Statut
        { wch: 25 },  // Période
        { wch: 15 },  // Frais
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, "ODMs.xlsx");
};

  return (
    <div>
      {/* Table Controls */}
      <div className="flex items-center mb-4">
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-fit h-7">
                <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="today">Aujourdhui</SelectItem>
              <SelectItem value="this-week">Cette semaine</SelectItem> */}
              <SelectItem value="this-month">Ce mois</SelectItem>
              <SelectItem value="last-month">Mois dernier</SelectItem>
              <SelectItem value="last-3-months">Trimestre</SelectItem>
              <SelectItem value="this-year">Cette année</SelectItem>
              <SelectItem value="last-year">Année dernière</SelectItem>
            </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
        <Input 
            placeholder="Recherche..." 
            className="h-7 w-sm lg:max-w-sm ml-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-sm"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Filtrer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem>
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
          <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-sm"
              onClick={handleExport}
          >
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Exporter</span>
          </Button>
        </div>
      </div>

      {/* ODM Datatable */}
      <Card>
        <CardContent className="pt-5 p-1 md:p-4">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="rounded-lg border-0">
                <TableHead className="rounded-l-lg">ID</TableHead>
                <TableHead className="hidden sm:table-cell">Titre</TableHead>
                <TableHead className="text-right md:text-left">Statut</TableHead>
                <TableHead className="hidden md:table-cell">Période</TableHead>
                <TableHead className="hidden md:table-cell md:rounded-r-lg">Frais</TableHead>
                <TableHead className="lg:hidden rounded-r-lg">{''}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center h-24">
                          <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : odms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Aucun ODM trouvé</TableCell>
                </TableRow>
              ) : (
                odms.map((odm) => <ODMTableRow key={odm.odmId} odm={odm} />)
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
                disabled={loading}
              >
                <RefreshCwIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Rafraîchir</span>
              </Button>
              <div className="hidden md:block">
                {lastUpdated.toLocaleString()}
              </div>
            </div>
          <Pagination className="flex flex-row justify-end gap-2">
            <PaginationContent className="flex items-center gap-2">
              {/* First page */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6 hidden md:flex"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
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
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
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
                <span className="text-sm text-muted-foreground hidden md:inline">
                  sur {totalPages}
                </span>
              </div>

              {/* Next */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages || loading}
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
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages || loading}
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
  );
};