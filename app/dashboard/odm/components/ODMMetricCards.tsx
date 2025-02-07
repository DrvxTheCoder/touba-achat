"use client";

import { useState, useEffect } from 'react';
import { MetricCard, ErrorCard, LoadingCard, SimpleMetricCard } from '@/components/MetricCards';
import { Package2, Clock1, ClipboardList, ExternalLink, BanknoteIcon, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MetricsData {
  total: number;
  active: number;
  pending: number;
  completed: number;
  totalAmount: number;
}

interface ODMMetricsProps {
  timeRange: string;
}

export default function ODMMetricsCard({ timeRange }: ODMMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/odm-data?timeRange=${timeRange}`);
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

  const handleCardAction = (type: 'all' | 'active' | 'pending' | 'completed') => {
    router.push(`/dashboard/odm?filter=${type}&timeRange=${timeRange}`);
  };

  if (loading) {
    return (
      <div className="flex md:flex-row flex-col gap-4">
        <div className='md:w-fit'>
          <LoadingCard isLoadingTitle="Chargement des métriques..."/>
        </div>
        <div className="w-full grid gap-4 md:grid-cols-3">
        <LoadingCard isLoadingTitle="Chargement des métriques..." />
        <LoadingCard isLoadingTitle="Chargement des métriques..." />
        <LoadingCard isLoadingTitle="Chargement des métriques..." />
      </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <ErrorCard 
        message={error || "Une erreur s'est produite lors du calcul des métriques."} 
        className="md:col-span-4"
      />
    );
  }

  const timeRangeLabels: Record<string, string> = {
    'today': "Aujourd'hui",
    'this-week': 'Cette semaine',
    'this-month': 'Ce mois',
    'last-month': 'Mois dernier',
    'last-3-months': 'Trimestre',
    'this-year': 'Cette année',
    'last-year': "Année dernière"
  };

  return (
    <div className="flex md:flex-row flex-col gap-4">
    <div className='md:w-fit'>
    <SimpleMetricCard
        title="Total"
        value={metrics.total}
        description={`${timeRangeLabels[timeRange] || 'Sur la période'}`}
      />
    </div>
    <div className="w-full grid gap-4 md:grid-cols-3">
    <MetricCard
        title="En Attente"
        value={metrics.pending}
        icon={<Clock1 className="h-6 w-6" />}
        description='En attente de validation'
        // action={
        //   <Button
        //     variant="outline"
        //     className="h-6"
        //     onClick={() => handleCardAction('pending')}
        //   >
        //     <small className="hidden md:block font-bold">Voir</small>
        //     <ExternalLink className="h-4 w-4 md:hidden" />
        //   </Button>
        // }
      />

      <MetricCard
        title="Actifs"
        value={metrics.active}
        icon={<Activity className="h-6 w-6" />}
        description='En cours de traitement'
        // action={
        //   <Button
        //     variant="outline"
        //     className="h-6"
        //     onClick={() => handleCardAction('active')}
        //   >
        //     <small className="hidden md:block font-bold">Voir</small>
        //     <ExternalLink className="h-4 w-4 md:hidden" />
        //   </Button>
        // }
      />

      <MetricCard
        title="Montant Total"
        value={metrics.totalAmount}
        description="XOF"
        icon={<BanknoteIcon className="h-6 w-6" />}
      />
      </div>

    </div>
  );
}