'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Droplet } from 'lucide-react';

interface ReservoirStockCardProps {
  selectedCenterId?: number | null;
}

interface ReservoirConfig {
  id: number;
  name: string;
  type: string;
  capacity: number;
}

interface ReservoirStock {
  reservoirName: string;
  reservoirType: string;
  capacity: number;
  stockActuel: number;
  pourcentageRemplissage: number;
  derniereMAJ: string;
}

export default function ReservoirStockCard({ selectedCenterId }: ReservoirStockCardProps) {
  const [reservoirs, setReservoirs] = useState<ReservoirConfig[]>([]);
  const [selectedReservoirId, setSelectedReservoirId] = useState<string>('');
  const [stockData, setStockData] = useState<ReservoirStock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservoirs();
  }, [selectedCenterId]);

  useEffect(() => {
    if (selectedReservoirId) {
      fetchStockData(selectedReservoirId);
    }
  }, [selectedReservoirId]);

  const fetchReservoirs = async () => {
    try {
      const url = selectedCenterId
        ? `/api/production/settings/reservoirs?centerId=${selectedCenterId}`
        : '/api/production/settings/reservoirs';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReservoirs(data);

        // Auto-select first reservoir
        if (data.length > 0 && !selectedReservoirId) {
          setSelectedReservoirId(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching reservoirs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (reservoirId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/production/reservoir-stock/${reservoirId}`);
      if (response.ok) {
        const data = await response.json();
        setStockData(data);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'SPHERE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'CIGARE':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading && reservoirs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reservoirs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            Stock Actuel par Réservoir
          </CardTitle>
          <CardDescription>Aucun réservoir configuré</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Veuillez configurer des réservoirs dans les paramètres</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle>Stock Actuel </CardTitle>
              <CardDescription><small className='text-xs text-muted-foreground'>par Réservoir</small></CardDescription>
            </div>
          </div>
          <Select value={selectedReservoirId} onValueChange={setSelectedReservoirId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sélectionner un réservoir" />
            </SelectTrigger>
            <SelectContent>
              {reservoirs.map((reservoir) => (
                <SelectItem key={reservoir.id} value={reservoir.id.toString()} className='gap-2'>
                  <div className="flex flex-row justify-between w-full gap-6">
                    <span className="font-mono w-full h-fit text-nowrap">{reservoir.name}</span>
                    <Badge variant="outline" className='text-xs py-0'>
                      <small className="text-xs">{reservoir.type}</small>
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        ) : stockData ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-mono">{stockData.reservoirName}</h3>
                <Badge className={getTypeBadgeClass(stockData.reservoirType)}>
                  {stockData.reservoirType}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {stockData.pourcentageRemplissage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Remplissage</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">0 T</span>
                <span className="text-muted-foreground">
                  {(stockData.capacity * 0.51).toFixed(2)} T
                </span>
              </div>
              <Progress
                value={stockData.pourcentageRemplissage}
                className="h-4"
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Stock Physique</p>
                <p className="text-2xl font-bold">{stockData.stockActuel.toFixed(3)} <small className='text-muted-foreground'>T</small></p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Capacité</p>
                <p className="text-2xl font-bold">
                  {(stockData.capacity * 0.51).toFixed(3)} <small className='text-muted-foreground'>T</small>
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Disponible</p>
                <p className="text-2xl font-bold">
                  {((stockData.capacity * 0.51) - stockData.stockActuel).toFixed(2)} <small className='text-muted-foreground'>T</small>
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Dernière MAJ</p>
                <p className="text-sm font-medium">
                  {new Date(stockData.derniereMAJ).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  stockData.pourcentageRemplissage > 80
                    ? 'bg-red-500 animate-pulse'
                    : stockData.pourcentageRemplissage > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              ></div>
              <span className="text-muted-foreground">
                {stockData.pourcentageRemplissage > 80
                  ? 'Niveau élevé - Attention'
                  : stockData.pourcentageRemplissage > 50
                  ? 'Niveau moyen'
                  : 'Niveau faible'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune donnée disponible pour ce réservoir</p>
            <p className="text-sm mt-2">
              Le stock sera calculé après le premier inventaire complété
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
