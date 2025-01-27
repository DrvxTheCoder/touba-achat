import { useState, useEffect } from 'react';
import { MetricCard, ErrorCard, LoadingCard } from '@/components/MetricCards';
import { BarChart3, ClipboardList, AlertCircle, ExternalLink, Package2, Clock1 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MetricsData {
  total: number;
  active: number;
  pending: number;
}

interface EDBMetricsProps {
  timeRange: string;
}

export default function EDBMetrics({ timeRange }: EDBMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/edb-data?timeRange=${timeRange}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des métriques');
        const data = await response.json();
        setMetrics(data.metrics);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setError('Erreur lors du chargement des métriques');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  const handleCardAction = (filter: string) => {
    router.push(`/dashboard/etats?filter=${filter}&timeRange=${timeRange}`);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <LoadingCard isLoadingTitle="Chargement des métriques..." />
        <LoadingCard isLoadingTitle="Chargement des métriques..." />
        <LoadingCard isLoadingTitle="Chargement des métriques..." />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <ErrorCard 
        message={error || "Une erreur s'est produite lors du calcul des métriques."} 
        className="md:col-span-3"
      />
    );
  }

  const timeRangeLabels: Record<string, string> = {
    'this-month': 'ce mois',
    'last-month': 'le mois dernier',
    'last-3-months': 'ce trimestre',
    'this-year': 'cette année',
    'last-year': "l'année dernière"
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Total des États"
        value={metrics.total}
        description={`Pour ${timeRangeLabels[timeRange] || 'la période'}`}
        icon={<Package2 className="h-6 w-6" />}
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCardAction('all')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        }
      />

      <MetricCard
        title="États en Attente"
        value={metrics.pending}
        description="En attente de validation"
        icon={<Clock1 className="h-6 w-6" />}
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCardAction('pending')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        }
      />

      <MetricCard
        title="États Actifs"
        value={metrics.active}
        description="En cours de traitement"
        icon={<ClipboardList className="h-6 w-6" />}
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCardAction('active')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}