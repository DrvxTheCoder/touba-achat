'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { formatDuration } from '@/lib/types/production';

interface DashboardStats {
  today?: {
    id: number;
    status: string;
    rendement?: number;
    tempsTotal: number;
    tempsArret: number;
    _count: { arrets: number };
  };
  period: {
    avgStockInitial: number;
    avgStockFinal: number;
    avgCumulSortie: number;
    avgEcart: number;
    avgRendement: number;
    totalBottles: number;
  };
}

export function ProductionDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/dashboard?period=month');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tempsEcoule = stats?.today?.tempsTotal
    ? stats.today.tempsTotal - stats.today.tempsArret
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tableau de bord</CardTitle>
        <CardDescription>Statistiques de production</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aujourd'hui */}
        {stats?.today && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Aujourd&apos;hui</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Temps productif</p>
                  <p className="font-medium">{formatDuration(tempsEcoule)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Rendement</p>
                  <p className="font-medium">{stats.today.rendement?.toFixed(1) || '0.0'}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Arrêts</p>
                  <p className="font-medium">{stats.today._count.arrets}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ce mois */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium text-sm">Ce mois</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Rendement moyen</p>
                <p className="font-medium">{stats?.period?.avgRendement?.toFixed(1) || '0.0'}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Bouteilles totales</p>
                <p className="font-medium">{stats?.period?.totalBottles?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Sortie moyenne</p>
                <p className="font-medium">{stats?.period?.avgCumulSortie?.toFixed(2) || '0.00'}T</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Écart moyen</p>
                <p className="font-medium">{stats?.period?.avgEcart?.toFixed(2) || '0.00'}T</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
