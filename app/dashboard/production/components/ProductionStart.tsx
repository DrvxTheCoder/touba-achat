'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProductionStartProps {
  selectedCenterId?: number;
}

export function ProductionStart({ selectedCenterId }: ProductionStartProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [stockInitial, setStockInitial] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const router = useRouter();

  // Fetch previous day's stock final when date changes
  useEffect(() => {
    const fetchPreviousStock = async () => {
      setLoadingStock(true);
      try {
        // Calculate previous day
        const previousDay = new Date(date);
        previousDay.setDate(previousDay.getDate() - 1);
        previousDay.setHours(0, 0, 0, 0);

        // Fetch inventories to find previous day's inventory
        const response = await fetch(
          `/api/production?dateFrom=${previousDay.toISOString()}&dateTo=${previousDay.toISOString()}&status=TERMINE`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const previousInventory = data.data[0];
            if (previousInventory.stockFinalPhysique !== null) {
              setStockInitial(previousInventory.stockFinalPhysique.toString());
              toast.info('Stock automatique', {
                description: `Stock final de la veille: ${previousInventory.stockFinalPhysique.toFixed(2)} tonnes`
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur récupération stock précédent:', error);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchPreviousStock();
  }, [date]);

  const handleStart = async () => {
    if (!selectedCenterId) {
      toast.error('Centre de production requis', {
        description: 'Veuillez sélectionner un centre de production'
      });
      return;
    }

    if (!stockInitial || parseFloat(stockInitial) < 0) {
      toast.error('Stock initial requis', {
        description: 'Veuillez saisir le stock initial physique'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          stockInitialPhysique: parseFloat(stockInitial),
          productionCenterId: selectedCenterId || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.existingId) {
          toast.info('Journée déjà démarrée', {
            description: 'Redirection vers la journée en cours...'
          });
          router.push(`/dashboard/production/${data.existingId}`);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast.success('Journée démarrée !', {
        description: 'La fiche de production a été créée'
      });
      
      router.push(`/dashboard/production/${data.id}`);
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de démarrer la journée'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='w-fit'>
      <CardHeader>
        <CardTitle>🌅 Démarrer une Nouvelle Journée</CardTitle>
        <CardDescription>
          Créer la fiche de production pour la journée sélectionnée
        </CardDescription>
        {!selectedCenterId && (
          <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
            ⚠️ Veuillez sélectionner un centre de production
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            className="rounded-md border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockInitial">
            Stock Initial Physique (tonnes)
            {loadingStock && <span className="text-xs text-muted-foreground ml-2">(Chargement...)</span>}
          </Label>
          <Input
            id="stockInitial"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 45.50"
            value={stockInitial}
            onChange={(e) => setStockInitial(e.target.value)}
            disabled={loadingStock}
          />
          <p className="text-xs text-muted-foreground">
            Le stock est automatiquement récupéré du stock final de la veille
          </p>
        </div>
        <Button
          onClick={handleStart}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Démarrage...' : 'Démarrer la Journée'}
        </Button>
      </CardContent>
    </Card>
  );
}