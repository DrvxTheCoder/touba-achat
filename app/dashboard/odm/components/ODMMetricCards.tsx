// components/ODMMetrics.tsx
import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/cards/MetricCard';
import { DollarSign, LuggageIcon, CheckCircleIcon, ClockIcon, TrendingUpIcon, TrendingUp } from "lucide-react";

interface ODMMetricsData {
  aggregatedData: {
    total: number;
    active: number;
    pending: number;
    processedByRH: number;
    totalCostSum: number;
    percentageChange: string;
  };
  chartData: any; // You can define a more specific type if needed
}

export function ODMMetrics() {
  const [metrics, setMetrics] = useState<ODMMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/dashboard/odm-data');
        if (!response.ok) {
          throw new Error('Failed to fetch ODM metrics');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching ODM metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
      {/* <MetricCard
        title="Évolution"
        value={`${metrics?.aggregatedData.percentageChange ?? 0}%`}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
        trend={parseFloat(metrics?.aggregatedData.percentageChange ?? '0')}
      /> */}
      <MetricCard
        title="Dépenses Totales"
        value={formatCurrency(metrics?.aggregatedData.totalCostSum ?? 0)}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <MetricCard
        title="Total ODMs"
        value={metrics?.aggregatedData.total ?? 0}
        icon={<LuggageIcon className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
        trend={parseFloat(metrics?.aggregatedData.percentageChange ?? '0')}
      />
      <MetricCard
        title="Traités"
        value={metrics?.aggregatedData.processedByRH ?? 0}
        icon={<CheckCircleIcon className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <MetricCard
        title="En attente"
        value={metrics?.aggregatedData.pending ?? 0}
        icon={<ClockIcon className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />

    </div>
  );
}