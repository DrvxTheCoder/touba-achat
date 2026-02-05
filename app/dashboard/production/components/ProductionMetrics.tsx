'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, TrendingUp, AlertTriangle, Gauge, DropletIcon } from 'lucide-react';
import StockLiquidGauge from './StockLiquidGauge';
import ReservoirStockCard from './ReservoirStockCard';

interface ProductionMetricsProps {
  selectedCenterId?: number | null;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface MetricsData {
  stockPhysiqueActuel: number;
  capaciteTotale: number;
  productionJour: number;
  rendementMoyen: number;
  ecartMoyen: number;
  tempsArretTotal: number;
  inventairesTermines: number;
  totalBottlesProduced: number;
  cumulConditionee: number;
  rendementHoraireMoyen: number;
  pourcentage24TMoyen: number;
  tempsTotal: number;
  tempsUtile: number;
  ecartMoyenTonnes: number;
  ecartMoyenPourcentage: number;
  creuxMoyen: number;
  cumulSortie: {
    bottles: number;
    ngabou: number;
    exports: number;
    divers: number;
    total: number;
  };
}

const convertMinutesToHours = (minutes: number): string => {
  const totalHours = minutes / 60;
  const hours = Math.floor(totalHours);
  const mins = Math.round((totalHours - hours) * 60);
  return `${hours}H${mins.toString().padStart(2, '0')}`;
};

export default function ProductionMetrics({ selectedCenterId, period, dateFrom, dateTo }: ProductionMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [selectedCenterId, period, dateFrom, dateTo]);

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCenterId) params.set('centerId', selectedCenterId.toString());
      if (dateFrom) {
        params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
      } else if (period) {
        params.set('period', period);
      }

      const url = `/api/production/metrics${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Impossible de charger les métriques</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Bouteilles Produites"
          value={metrics.totalBottlesProduced.toLocaleString()}
          icon={<Package className="h-5 w-5 text-blue-600" />}
        />

        <MetricCard
          title="Cumul Conditionné"
          value={`${metrics.cumulConditionee.toFixed(3)} T`}
          icon={<DropletIcon className="h-5 w-5 text-green-600" />}
          subtitle="Bouteilles produites"
        />

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Rendement Horaire</p>
                <p className="text-2xl font-bold mt-2">
                  {metrics.rendementHoraireMoyen.toFixed(2)} T/h
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Gauge className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {metrics.pourcentage24TMoyen.toFixed(2)}% {"(24T/h)"}
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-full bg-muted">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <MetricCard
          title="Temps Total"
          value={convertMinutesToHours(metrics.tempsTotal)}
          icon={<Clock className="h-5 w-5 text-orange-600" />}
          subtitle={`Temps Utile: ${convertMinutesToHours(metrics.tempsUtile)}`}
        />
      </div>

      {/* Stock Physique avec Liquid Gauge et Additional Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <InfoCard
            title="Écart Total"
            value={`${metrics.ecartMoyenTonnes.toFixed(3)} T`}
            description={`SFP(T) - ST(T)`}
            className={
              Math.abs(metrics.ecartMoyenPourcentage) > 5
                ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
            }
            icon={
              Math.abs(metrics.ecartMoyenPourcentage) > 5 ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )
            }
          />

          <InfoCard
            title="Creux Moyen"
            value={`${metrics.creuxMoyen.toFixed(3)} T`}
            description={`${((metrics.creuxMoyen / metrics.capaciteTotale) * 100).toFixed(1)}% de la capacité`}
            className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
          />

          <InfoCard
            title="Cumul Sortie"
            value={`${metrics.cumulSortie.total.toFixed(3)} T`}
            description={`Bouteilles : ${metrics.cumulSortie.bottles.toFixed(2)}T | VRAC : ${(metrics.cumulSortie.total - metrics.cumulSortie.bottles).toFixed(2)}T`}
            className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900"
          />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <StockLiquidGauge
            value={metrics.stockPhysiqueActuel}
            capacity={metrics.capaciteTotale}
            title="Stock Physique Actuel"
            subtitle="Tous les réservoirs"
            size={180}
          />
        </div>
        <div className="lg:col-span-1">
          <ReservoirStockCard selectedCenterId={selectedCenterId} />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({ title, value, icon, subtitle }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-full bg-muted">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  description: string;
  className?: string;
  icon?: React.ReactNode;
}

function InfoCard({ title, value, description, className, icon }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardContent className="px-6 py-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          {icon && <div>{icon}</div>}
        </div>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
