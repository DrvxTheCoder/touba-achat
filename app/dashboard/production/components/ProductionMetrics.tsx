'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Clock, AlertTriangle } from 'lucide-react';
import StockLiquidGauge from './StockLiquidGauge';

interface ProductionMetricsProps {
  selectedCenterId?: number | null;
}

interface MetricsData {
  stockPhysiqueActuel: number;
  capaciteTotale: number;
  productionJour: number;
  rendementMoyen: number;
  ecartMoyen: number;
  tempsArretTotal: number;
  inventairesTermines: number;
}

export default function ProductionMetrics({ selectedCenterId }: ProductionMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    stockPhysiqueActuel: 0,
    capaciteTotale: 0,
    productionJour: 0,
    rendementMoyen: 0,
    ecartMoyen: 0,
    tempsArretTotal: 0,
    inventairesTermines: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [selectedCenterId]);

  const fetchMetrics = async () => {
    try {
      const url = selectedCenterId
        ? `/api/production/metrics?centerId=${selectedCenterId}`
        : '/api/production/metrics';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production du jour */}
        <MetricCard
          title="Production du jour"
          value={`${metrics.productionJour.toFixed(2)} T`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          trend={metrics.productionJour > 0 ? 'up' : 'neutral'}
          subtitle="Bouteilles remplies"
        />

        {/* Rendement moyen */}
        <MetricCard
          title="Rendement moyen"
          value={`${metrics.rendementMoyen.toFixed(1)}%`}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          trend={metrics.rendementMoyen >= 90 ? 'up' : metrics.rendementMoyen >= 75 ? 'neutral' : 'down'}
          subtitle="Temps utile / temps total"
        />

        {/* Écart moyen */}
        <MetricCard
          title="Écart moyen"
          value={`${Math.abs(metrics.ecartMoyen).toFixed(2)}%`}
          icon={
            Math.abs(metrics.ecartMoyen) > 5 ? (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-600" />
            )
          }
          trend={Math.abs(metrics.ecartMoyen) > 5 ? 'down' : 'up'}
          subtitle="Stock théorique vs physique"
        />

        {/* Inventaires terminés */}
        <MetricCard
          title="Inventaires ce mois"
          value={metrics.inventairesTermines.toString()}
          icon={<Calendar className="h-5 w-5 text-purple-600" />}
          trend="neutral"
          subtitle="Journées complétées"
        />
      </div>

      {/* Stock Physique avec Liquid Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <StockLiquidGauge
            value={metrics.stockPhysiqueActuel}
            capacity={metrics.capaciteTotale}
            title="Stock Physique Actuel"
            subtitle="Tous les réservoirs"
            size={180}
          />
        </div>

        {/* Additional Info Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            title="Temps d'arrêt total"
            value={`${Math.floor(metrics.tempsArretTotal / 60)}h ${metrics.tempsArretTotal % 60}min`}
            description="Cumul des arrêts ce mois"
            className="bg-orange-50 dark:bg-orange-950/20"
          />

          <InfoCard
            title="Taux de remplissage"
            value={`${((metrics.stockPhysiqueActuel / metrics.capaciteTotale) * 100).toFixed(1)}%`}
            description="Stock actuel / Capacité totale"
            className="bg-blue-50 dark:bg-blue-950/20"
          />

          <InfoCard
            title="Stock disponible"
            value={`${(metrics.capaciteTotale - metrics.stockPhysiqueActuel).toFixed(2)} T`}
            description="Capacité restante"
            className="bg-green-50 dark:bg-green-950/20"
          />

          <InfoCard
            title="Production moyenne"
            value={`${(metrics.productionJour / (metrics.inventairesTermines || 1)).toFixed(2)} T`}
            description="Par jour d'inventaire"
            className="bg-purple-50 dark:bg-purple-950/20"
          />
        </div>
      </div>
    </div>
  );
}

// MetricCard Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

function MetricCard({ title, value, icon, trend, subtitle }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

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
          <div className={`p-2 rounded-full bg-muted`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// InfoCard Component
interface InfoCardProps {
  title: string;
  value: string;
  description: string;
  className?: string;
}

function InfoCard({ title, value, description, className }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
