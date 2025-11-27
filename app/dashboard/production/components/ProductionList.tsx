// app/dashboard/production/ProductionList.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertCircle, CheckCircle, Clock, List } from 'lucide-react';
import { ProductionInventory, STATUS_LABELS, formatDuration } from '@/lib/types/production';

export default function ProductionList() {
  const router = useRouter();
  const [inventories, setInventories] = useState<ProductionInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadInventories();
  }, [page]);

  const loadInventories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/production?page=${page}&limit=5`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setInventories(data.data); // L'API retourne 'data' pas 'inventories'
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (inventories.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun inventaire</h3>
        <p className="text-muted-foreground">
          Commencez par démarrer une nouvelle journée de production
        </p>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'TERMINE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'ARCHIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEcartColor = (ecartPourcentage: number) => {
    const abs = Math.abs(ecartPourcentage);
    if (abs <= 2) return 'text-green-600';
    if (abs <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Header with "Voir tout" button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Inventaires Récents</h3>
        <Link href="/dashboard/production/liste-inventaires">
          <Button variant="outline" size="sm">
            <List className="h-4 w-4 mr-2" />
            Voir tout
          </Button>
        </Link>
      </div>

      {inventories.map((inventory) => (
        <Card key={inventory.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">
                  {new Date(inventory.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <Badge className={getStatusColor(inventory.status)}>
                  {STATUS_LABELS[inventory.status]}
                </Badge>
              </div>

              <div className="flex flex-row gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Démarré par:</span>{' '}
                  {inventory.startedBy?.name}
                </div>
                {/* <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Temps:</span>{' '}
                  {inventory.rendement !== null && inventory.rendement !== undefined
                    ? `${inventory.rendement.toFixed(1)}% rendement`
                    : 'En cours...'}
                </div> */}
                {inventory.status === 'TERMINE' && (
                  <>
                    <div>
                      <span className="font-medium">Bouteilles:</span>{' '}
                      {inventory.totalBottlesProduced?.toLocaleString() || 0}
                    </div>
                    <div>
                      <span className="font-medium">Écart:</span>{' '}
                      <span className={getEcartColor(inventory.ecartPourcentage || 0)}>
                        {inventory.ecartPourcentage?.toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
                {inventory.arrets && inventory.arrets.length > 0 && (
                  <div>
                    <span className="font-medium">Arrêts:</span>{' '}
                    {inventory.arrets.length} ({formatDuration(inventory.tempsArret)})
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/production/${inventory.id}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Button>
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}