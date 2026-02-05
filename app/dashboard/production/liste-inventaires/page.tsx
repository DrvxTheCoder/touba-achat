'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 15;

export default function ListeInventairesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedCenterId, setSelectedCenterId] = useState<string>('all');
  const [inventories, setInventories] = useState<any[]>([]);
  const [productionCenters, setProductionCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(true);
  const [userCenterId, setUserCenterId] = useState<number | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
          setSelectedCenterId(data.center.id.toString());
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
  }, [page, selectedCenterId, searchQuery]);

  const loadInventories = async () => {
    try {
      setLoading(true);
      let url = `/api/production?page=${page}&limit=${ITEMS_PER_PAGE}`;

      if (selectedCenterId && selectedCenterId !== 'all') {
        url += `&centerId=${selectedCenterId}`;
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
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des centres de production');
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleCenterChange = (value: string) => {
    setSelectedCenterId(value);
    setPage(1);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);

    const monthName = months.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const loadingToast = toast.loading(`Génération du rapport ${monthName} ${selectedYear}...`);

    try {
      // Calculate date range for selected month and year
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

      // Fetch metrics to get capaciteTotale
      const metricsRes = await fetch('/api/production/metrics');
      if (!metricsRes.ok) {
        throw new Error('Erreur lors de la récupération des métriques');
      }
      const metrics = await metricsRes.json();

      const exportCenterId = !isPrivileged && userCenterId
        ? userCenterId
        : (selectedCenterId !== 'all' ? parseInt(selectedCenterId) : undefined);

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
          ...(exportCenterId && { productionCenterId: exportCenterId }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'export');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const filename = format === 'excel'
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
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export',
        id: loadingToast,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);

    const monthName = months.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const loadingToast = toast.loading(`Préparation de l'impression ${monthName} ${selectedYear}...`);

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

      const exportCenterId = !isPrivileged && userCenterId
        ? userCenterId
        : (selectedCenterId !== 'all' ? parseInt(selectedCenterId) : undefined);

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
          ...(exportCenterId && { productionCenterId: exportCenterId }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la préparation');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open in new window and trigger print
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }

      toast.success('Document prêt pour l\'impression', {
        description: `Rapport de ${monthName} ${selectedYear}`,
        id: loadingToast,
      });

      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Erreur lors de l\'impression',
        id: loadingToast,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export des Rapports Mensuels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Year Selection */}
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Production Center Selection */}
            <div className="space-y-2">
              <Label htmlFor="center">Centre de Production</Label>
              <Select
                value={selectedCenterId}
                onValueChange={handleCenterChange}
                disabled={!isPrivileged}
              >
                <SelectTrigger id="center">
                  <SelectValue placeholder="Sélectionner un centre" />
                </SelectTrigger>
                <SelectContent>
                  {isPrivileged && (
                    <SelectItem value="all">Tous les centres</SelectItem>
                  )}
                  {productionCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id.toString()}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              Télécharger PDF
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer PDF
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Sélectionnez un mois, une année et optionnellement un centre de production pour exporter le rapport mensuel.
          </p>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Liste des Inventaires ({total})</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par date (jj/mm) ou nom..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          ) : inventories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun inventaire trouvé.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Centre</th>
                      <th className="text-left p-3 font-semibold">Démarré par</th>
                      <th className="text-left p-3 font-semibold">Statut</th>
                      <th className="text-left p-3 font-semibold">Stock Final (T)</th>
                      <th className="text-left p-3 font-semibold">Écart (%)</th>
                      <th className="text-left p-3 font-semibold">Rendement (%)</th>
                      <th className="text-left p-3 font-semibold">Bouteilles</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventories.map((inventory) => (
                      <tr key={inventory.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          {new Date(inventory.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-3">
                          {inventory.productionCenter?.name || 'Non spécifié'}
                        </td>
                        <td className="p-3 text-sm">
                          {inventory.startedBy?.name || '-'}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              inventory.status === 'TERMINE'
                                ? 'default'
                                : inventory.status === 'EN_COURS'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {inventory.status === 'TERMINE'
                              ? 'Terminé'
                              : inventory.status === 'EN_COURS'
                              ? 'En cours'
                              : 'Archivé'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {inventory.stockFinalPhysique?.toFixed(3) || '0.000'}
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              Math.abs(inventory.ecartPourcentage || 0) > 5
                                ? 'text-red-600 font-semibold'
                                : Math.abs(inventory.ecartPourcentage || 0) > 2
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }
                          >
                            {inventory.ecartPourcentage?.toFixed(2) || '0.00'}%
                          </span>
                        </td>
                        <td className="p-3">
                          {inventory.rendement?.toFixed(2) || '0.00'}%
                        </td>
                        <td className="p-3">{inventory.totalBottlesProduced || 0}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/production/${inventory.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages} ({total} inventaires)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      Début
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {page}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      Fin
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
