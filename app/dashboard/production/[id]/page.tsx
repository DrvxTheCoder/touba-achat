// app/dashboard/production/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, CheckCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProductionTimer from '../components/ProductionTimer';
import ArretDialog from '../components/ArretDialog';
import ProductionForm from '../components/ProductionForm';
import { ProductionInventory } from '@/lib/types/production';
import { ContentLayout } from '@/components/user-panel/content-layout';
import DynamicBreadcrumbs from '@/components/DynamicBreadcrumbs';

export default function ProductionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inventory, setInventory] = useState<ProductionInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadInventory();
    // Refresh toutes les 30 secondes si en cours
    const interval = setInterval(() => {
      if (inventory?.status === 'EN_COURS') {
        loadInventory();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  const loadInventory = async () => {
    try {
      const res = await fetch(`/api/production/${params.id}`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const handleArretAdded = () => {
    loadInventory();
    toast.success('Arrêt enregistré');
  };

  const handleAutoSave = async (formData: Partial<ProductionInventory>) => {
    try {
      const res = await fetch(`/api/production/${params.id}/autosave`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Erreur sauvegarde automatique');
      
      const data = await res.json();
      return data.savedAt;
    } catch (error) {
      console.error('Auto-save error:', error);
      return null;
    }
  };

  const handleComplete = async (formData: any) => {
    try {
      setCompleting(true);
      const res = await fetch(`/api/production/${params.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la clôture');
      }

      const data = await res.json();
      toast.success('Inventaire clôturé avec succès');
      router.push('/dashboard/production');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la clôture');
    } finally {
      setCompleting(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading(`Génération du fichier ${format.toUpperCase()}...`);

      const res = await fetch(`/api/production/${params.id}/export?format=${format}`);

      if (!res.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const filename = `inventaire_production_${new Date(inventory?.date || new Date()).toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`Fichier ${format.toUpperCase()} téléchargé avec succès`);
    } catch (error: any) {
      console.error(error);
      toast.dismiss();
      toast.error(error.message || 'Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Inventaire non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            Cet inventaire n&apos;existe pas ou a été supprimé
          </p>
          <Button onClick={() => router.push('/dashboard/production')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  const isEnCours = inventory.status === 'EN_COURS';
  const isTermine = inventory.status === 'TERMINE';

  return (
    <div className="container mx-auto py-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/production')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Inventaire du {new Date(inventory.date).toLocaleDateString('fr-FR')}
            </h1>
            <p className="text-sm text-muted-foreground">
              Démarré par {inventory.startedBy?.name} à{' '}
              {new Date(inventory.startedAt).toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Exporter en Excel
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Exporter en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isTermine && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Terminé</span>
            </div>
          )}
        </div>
      </div>

      {/* Timer et Arrêts */}
      {isEnCours && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <ProductionTimer
              startedAt={inventory.startedAt}
              totalArrets={inventory.tempsArret || 0}
              rendement={inventory.rendement || 0}
            />
            <ArretDialog
              inventoryId={inventory.id}
              onArretAdded={handleArretAdded}
            />
          </div>
        </Card>
      )}

      {/* Liste des arrêts */}
      {inventory.arrets && inventory.arrets.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            Arrêts enregistrés ({inventory.arrets.length})
          </h3>
          <div className="space-y-2">
            {inventory.arrets.map((arret) => (
              <div
                key={arret.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{arret.type}</div>
                  <div className="text-sm text-muted-foreground">
                    Ajouté le {new Date(arret.createdAt).toLocaleString('fr-FR')}
                  </div>
                  {arret.remarque && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {arret.remarque}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">{arret.duree} min</div>
                  <div className="text-xs text-muted-foreground">
                    {arret.createdBy?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Formulaire de production */}
      <ProductionForm
        inventory={inventory}
        onAutoSave={handleAutoSave}
        onComplete={handleComplete}
        completing={completing}
        disabled={isTermine}
      />
    </div>
  );
}