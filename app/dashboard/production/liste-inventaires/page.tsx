'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileText,
  Printer,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  User,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SpinnerCircular } from 'spinners-react';

const ITEMS_PER_PAGE = 15;

interface ProductionCenter {
  id: number;
  name: string;
}

interface Inventory {
  id: number;
  date: string;
  status: string;
  stockFinalPhysique: number | null;
  startedBy?: { name: string };
  productionCenter?: { id: number; name: string };
}

export default function ListeInventairesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedExportCenterId, setSelectedExportCenterId] = useState<string>('');
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(true);
  const [userCenterId, setUserCenterId] = useState<number | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.role && ['ADMIN', 'IT_ADMIN'].includes(session.user.role);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState<Inventory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const months = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  // Fetch user's center assignment
  useEffect(() => {
    const fetchUserCenter = async () => {
      try {
        const res = await fetch('/api/production/settings/centers/mine');
        if (!res.ok) return;
        const data = await res.json();
        setIsPrivileged(data.isPrivileged);
        if (!data.isPrivileged && data.center) {
          setUserCenterId(data.center.id);
          setActiveTab(data.center.id.toString());
          setSelectedExportCenterId(data.center.id.toString());
        }
      } catch (error) {
        console.error('Error fetching user center:', error);
      }
    };
    fetchUserCenter();
  }, []);

  useEffect(() => {
    loadProductionCenters();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reload inventories when filters change
  useEffect(() => {
    loadInventories();
  }, [page, activeTab, searchQuery]);

  const loadInventories = async () => {
    try {
      setLoading(true);
      let url = `/api/production?page=${page}&limit=${ITEMS_PER_PAGE}`;

      if (activeTab && activeTab !== 'all') {
        url += `&centerId=${activeTab}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur de chargement');
      const response = await res.json();
      setInventories(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des inventaires');
    } finally {
      setLoading(false);
    }
  };

  const loadProductionCenters = async () => {
    try {
      const res = await fetch('/api/production/settings/centers');
      if (!res.ok) throw new Error('Erreur de chargement');
      const centers = await res.json();
      setProductionCenters(centers || []);
      // Set default export center to first center
      if (centers && centers.length > 0 && !selectedExportCenterId) {
        setSelectedExportCenterId(centers[0].id.toString());
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des centres de production');
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  const handleDeleteClick = (inventory: Inventory, e: React.MouseEvent) => {
    e.stopPropagation();
    setInventoryToDelete(inventory);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inventoryToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/production/${inventoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      const data = await res.json();
      toast.success(data.message || 'Inventaire supprimé avec succès');
      loadInventories(); // Reload the list
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setInventoryToDelete(null);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);

    const monthName = months.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    const loadingToast = toast.loading(`Génération du rapport ${monthName} ${selectedYear}...`);

    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const metricsRes = await fetch('/api/production/metrics');
      if (!metricsRes.ok) {
        throw new Error('Erreur lors de la récupération des métriques');
      }
      const metrics = await metricsRes.json();

      if (!selectedExportCenterId) {
        throw new Error('Veuillez sélectionner un centre de production');
      }

      const response = await fetch('/api/production/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          capaciteTotale: metrics.capaciteTotale,
          productionCenterId: parseInt(selectedExportCenterId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const filename =
        format === 'excel'
          ? `production_${monthName}_${selectedYear}.xlsx`
          : `production_${monthName}_${selectedYear}.pdf`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Export réussi`, {
        description: `Le rapport de ${monthName} ${selectedYear} a été téléchargé avec succès.`,
        id: loadingToast,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : "Erreur lors de l'export",
        id: loadingToast,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);

    const monthName = months.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    const loadingToast = toast.loading(
      `Préparation de l'impression ${monthName} ${selectedYear}...`
    );

    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const metricsRes = await fetch('/api/production/metrics');
      if (!metricsRes.ok) {
        throw new Error('Erreur lors de la récupération des métriques');
      }
      const metrics = await metricsRes.json();

      if (!selectedExportCenterId) {
        throw new Error('Veuillez sélectionner un centre de production');
      }

      const response = await fetch('/api/production/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'pdf',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          capaciteTotale: metrics.capaciteTotale,
          productionCenterId: parseInt(selectedExportCenterId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la préparation');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }

      toast.success("Document prêt pour l'impression", {
        description: `Rapport de ${monthName} ${selectedYear}`,
        id: loadingToast,
      });

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : "Erreur lors de l'impression",
        id: loadingToast,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TERMINE':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 w-fit">
            Terminé
          </Badge>
        );
      case 'EN_COURS':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 w-fit">
            En cours
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground w-fit">
            Archivé
          </Badge>
        );
    }
  };

  const renderInventoryTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <SpinnerCircular
            size={50}
            thickness={100}
            speed={100}
            color="#36ad47"
            secondaryColor="rgba(73, 172, 57, 0.23)"
          />
        </div>
      );
    }

    if (inventories.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun inventaire trouvé.</p>
        </div>
      );
    }

    return (
      <>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-0">
              <TableHead className="rounded-l-lg font-semibold">
                Inventaire
              </TableHead>
              <TableHead className="hidden sm:table-cell font-semibold">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Centre / Responsable
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-right">
                Stock (T)
              </TableHead>
              <TableHead className="rounded-r-lg font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventories.map((inventory) => (
              <TableRow
                key={inventory.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/production/${inventory.id}`)}
              >
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-sm">
                      INV/{new Date(inventory.date).toLocaleDateString('fr-FR')}
                    </span>
                    {getStatusBadge(inventory.status)}
                    {/* Mobile only: show center info */}
                    <div className="sm:hidden flex flex-col gap-0.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {inventory.productionCenter?.name || 'Non spécifié'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{inventory.startedBy?.name || '-'}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">
                      {inventory.productionCenter?.name || 'Non spécifié'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{inventory.startedBy?.name || '-'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-3 text-right font-mono">
                  {inventory.stockFinalPhysique?.toFixed(3) || '0.000'}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/production/${inventory.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/production/${inventory.id}?edit=true`);
                          }}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDeleteClick(inventory, e)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Page {page} sur {totalPages}{' '}
              <span className="hidden sm:inline">({total} inventaires)</span>
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {/* Page number buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8 text-sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Export Section */}
      {/* Export Section - Modern Design */}
      <Card className="overflow-hidden border shadow-sm bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header Row */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Export Mensuel</h3>
                <p className="text-xs text-muted-foreground">
                  Générer un rapport PDF
                </p>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Month Selector */}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px] sm:w-[140px] h-9 bg-background/80 backdrop-blur-sm">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Selector */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[90px] h-9 bg-background/80 backdrop-blur-sm">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Center Selector */}
              <Select
                value={selectedExportCenterId}
                onValueChange={setSelectedExportCenterId}
                disabled={!isPrivileged}
              >
                <SelectTrigger className="flex-1 min-w-[140px] sm:w-[180px] sm:flex-none h-9 bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Centre" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {productionCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id.toString()}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions Row */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting || !selectedExportCenterId}
                variant="outline"
                className="flex-1 sm:flex-none h-10 bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <FileText className="h-4 w-4 mr-2 text-red-500" />
                <span>Télécharger PDF</span>
              </Button>
              <Button
                onClick={handlePrint}
                disabled={isExporting || !selectedExportCenterId}
                className="flex-1 sm:flex-none h-10"
              >
                <Printer className="h-4 w-4 mr-2" />
                <span>Imprimer</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List with Tabs */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg">Inventaires</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4 h-fit p-1 bg-muted/50 w-fit border">
              {isPrivileged && (
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-background"
                >
                  Tous
                </TabsTrigger>
              )}
              {productionCenters.map((center) => (
                <TabsTrigger
                  key={center.id}
                  value={center.id.toString()}
                  className="text-xs sm:text-sm px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-background"
                  disabled={!isPrivileged && userCenterId !== center.id}
                >
                  {center.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {renderInventoryTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;inventaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer définitivement l&apos;inventaire du{' '}
              <strong>
                {inventoryToDelete
                  ? new Date(inventoryToDelete.date).toLocaleDateString('fr-FR')
                  : ''}
              </strong>
              {inventoryToDelete?.productionCenter && (
                <> du centre <strong>{inventoryToDelete.productionCenter.name}</strong></>
              )}
              .
              <br /><br />
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
