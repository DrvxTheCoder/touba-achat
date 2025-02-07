"use client";

import { useState, useEffect } from 'react';
import { MetricCard, ErrorCard, LoadingCard, SimpleMetricCard } from '@/components/MetricCards';
import { Package2, Clock1, ClipboardList, ExternalLink, Eye, PackageCheck, HeartPulse, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilteredEDBDialog } from './EDBFilteredDialog';
import { useSearchParams, useRouter } from 'next/navigation';

interface MetricsData {
  total: number;
  active: number;
  pending: number;
  completed: number;
}

interface EDBMetricsProps {
  timeRange: string;
  onRefresh?: () => void;
}

export default function EDBMetrics({ timeRange }: EDBMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'all' | 'active' | 'pending' | 'completed';
    title: string;
  }>({
    isOpen: false,
    type: 'all',
    title: ''
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const filterParam = searchParams.get('filter');

  useEffect(() => {
    if (filterParam) {
      const titles = {
        all: 'Tous les États de Besoins',
        active: 'États de Besoins Actifs',
        pending: 'États de Besoins en Attente'
      };

      setDialogConfig({
        isOpen: true,
        type: filterParam as 'all' | 'active' | 'pending',
        title: titles[filterParam as keyof typeof titles] || titles.all
      });
    }
  }, [filterParam]);

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

  const handleCardAction = (type: 'all' | 'active' | 'pending' | 'completed') => {
    const titles = {
      all: 'Tous les États de Besoins',
      active: 'États de Besoins Actifs',
      pending: 'États de Besoins en Attente',
      completed: 'Traités'
    };

    setDialogConfig({
      isOpen: true,
      type,
      title: titles[type]
    });

    // Update URL with filter parameter
    router.push(`/dashboard/etats?filter=${type}&timeRange=${timeRange}`);
  };

  const handleDialogClose = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
    // Remove filter from URL when closing dialog
    router.push('/dashboard/etats');
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
        className="md:col-span-3"
      />
    );
  }

  const timeRangeLabels: Record<string, string> = {
    'today': "Aujourd'hui",
    'this-week': 'Cette semaine',
    'this-month': 'Ce mois',
    'last-month': 'Mois dernier',
    'last-3-months': 'Trimestre',
    'this-year': 'Année',
    'last-year': "Année précédente"
  };

  return (
    <>
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
          title="Actifs"
          value={metrics.active}
          description="En cours de traitement"
          icon={<Activity className="h-6 w-6" />}
          action={
            <Button
            variant="outline"
            className='h-6'
            onClick={() => handleCardAction('active')}
          >
            <small className='hidden md:block font-bold'>Voir</small><Eye className="h-4 w-4 md:hidden" />
          </Button>
          }
        />
        <MetricCard
          title="En Attente"
          value={metrics.pending}
          icon={<Clock1 className="h-6 w-6" />}
          action={
            <Button
              variant="outline"
              className='h-6'
              onClick={() => handleCardAction('pending')}
            >
              <small className='hidden md:block font-bold'>Voir</small><Eye className="h-4 w-4 md:hidden" />
            </Button>
          }
          description="En attente d'approbation"
        />

        <MetricCard
          title="Traités"
          value={metrics.completed}
          icon={<PackageCheck className="h-6 w-6" />}
          action={
          <Button
            variant="outline"
            className='h-6'
            onClick={() => handleCardAction('completed')}
          >
            <small className='hidden md:block font-bold'>Voir</small><Eye className="h-4 w-4 md:hidden" />
          </Button>
          }
        />
        </div>

      </div>

      <FilteredEDBDialog
        isOpen={dialogConfig.isOpen}
        onOpenChange={handleDialogClose}
        filterType={dialogConfig.type}
        timeRange={timeRange}
        title={dialogConfig.title}
      />
    </>
  );
}