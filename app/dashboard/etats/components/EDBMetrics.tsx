"use client";

import { useState, useEffect } from 'react';
import { MetricCard, ErrorCard, LoadingCard } from '@/components/MetricCards';
import { Package2, Clock1, ClipboardList, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilteredEDBDialog } from './EDBFilteredDialog';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'all' | 'active' | 'pending';
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

  const handleCardAction = (type: 'all' | 'active' | 'pending') => {
    const titles = {
      all: 'Tous les États de Besoins',
      active: 'États de Besoins Actifs',
      pending: 'États de Besoins en Attente'
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
    'today': "aujourd'hui",
    'this-week': 'cette semaine',
    'this-month': 'ce mois',
    'last-month': 'le mois dernier',
    'last-3-months': 'ce trimestre',
    'this-year': 'cette année',
    'last-year': "l'année dernière"
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total"
          value={metrics.total}
          description={`Pour ${timeRangeLabels[timeRange] || 'la période'}`}
          icon={<Package2 className="h-6 w-6" />}
        //   action={
        //     <Button
        //         variant="outline"
        //         className='h-6'
        //         onClick={() => handleCardAction('all')}
        //         >
        //         <small className='hidden md:block font-bold'>Voir</small><Eye className="h-4 w-4 md:hidden" />
        //     </Button>
        //   }
        />

        <MetricCard
          title="En Attente"
          value={metrics.pending}
          description="En attente de validation"
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
        />

        <MetricCard
          title="États Actifs"
          value={metrics.active}
          description="En cours de traitement"
          icon={<ClipboardList className="h-6 w-6" />}
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