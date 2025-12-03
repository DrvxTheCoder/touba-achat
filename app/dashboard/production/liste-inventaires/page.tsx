'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Printer, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ListeInventairesPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadInventories();
  }, []);

  const loadInventories = async () => {
    try {
      const res = await fetch('/api/production?limit=100');
      if (!res.ok) throw new Error('Erreur de chargement');
      const response = await res.json();
      setInventories(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des inventaires');
    } finally {
      setLoading(false);
    }
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l&apos;export');
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
        description: error instanceof Error ? error.message : 'Erreur lors de l&apos;export',
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year Selection */}
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Sélectionner l&apos;année" />
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
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {/* <Button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exporter en Excel
            </Button> */}
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
            Sélectionnez un mois et une année pour exporter le rapport mensuel de production.
          </p>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Inventaires</CardTitle>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Centre</th>
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
                              : ''
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
