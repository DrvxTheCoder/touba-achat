'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ListeInventairesPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

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
            <Button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exporter en Excel
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Exporter en PDF
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Sélectionnez un mois et une année pour exporter le rapport mensuel de production.
          </p>
        </CardContent>
      </Card>

      {/* Data Table Section (Placeholder for future implementation) */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Inventaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>La table des inventaires sera implémentée prochainement.</p>
            <p className="text-sm mt-2">
              Cette section affichera tous les inventaires avec recherche par date et pagination.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
