// app/dashboard/production/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ArrowLeft, Save, CheckCircle, Download, FileSpreadsheet, FileText, Printer, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductionTimer from '../components/ProductionTimer';
import ArretDialog from '../components/ArretDialog';
import ProductionForm from '../components/ProductionForm';
import { ProductionInventory } from '@/lib/types/production';
import { ContentLayout } from '@/components/user-panel/content-layout';
import DynamicBreadcrumbs from '@/components/DynamicBreadcrumbs';
import { SpinnerCircular } from 'spinners-react';

export default function ProductionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [inventory, setInventory] = useState<ProductionInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [calculatedTempsTotal, setCalculatedTempsTotal] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check if user is admin
  const isAdmin = session?.user?.role && ['ADMIN', 'IT_ADMIN'].includes(session.user.role);

  // Check if edit mode was requested via URL param (only if admin)
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isAdmin) {
      setIsEditMode(true);
    }
  }, [searchParams, isAdmin]);

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

  const handleEdit = async (formData: any) => {
    try {
      setCompleting(true);
      const res = await fetch(`/api/production/${params.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la modification');
      }

      const data = await res.json();
      toast.success('Inventaire modifié avec succès');
      setIsEditMode(false);
      setInventory(data);
      // Remove edit query param from URL
      router.replace(`/dashboard/production/${params.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelEdit = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelEdit = () => {
    setIsEditMode(false);
    setShowCancelDialog(false);
    loadInventory(); // Reload original data
    router.replace(`/dashboard/production/${params.id}`);
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

  const handlePrint = async () => {
    try {
      toast.loading('Préparation de l\'impression...');

      const res = await fetch(`/api/production/${params.id}/export?format=pdf`);

      if (!res.ok) {
        throw new Error('Erreur lors de la préparation');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Open in new window and trigger print
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }

      toast.dismiss();
      toast.success('Document prêt pour l\'impression');

      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error(error);
      toast.dismiss();
      toast.error(error.message || 'Erreur lors de l\'impression');
    }
  };

  if (loading) {
    return (
            <main className="flex flex-1 flex-col gap-4 p-1 lg:gap-6 lg:p-6">
              <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
                <div className="flex flex-col items-center gap-4 text-center">
                  <SpinnerCircular size={70} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                  <h3 className="text-2xl font-bold tracking-tight">
                    Chargement...
                  </h3>
                </div>
              </div>
            </main>
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
    <div className="container px-2 md:px-6 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/production')}
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className='hidden md:block'>Retour</span>
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-bold wrap">
              INV/{new Date(inventory.date).toLocaleDateString('fr-FR')}
              {/* {isEditMode && <span className="ml-2 text-orange-600">(Mode édition)</span>} */}
            </h1>
            <p className="text-sm text-muted-foreground">
              Cloturé par {inventory.startedBy?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit mode controls */}


          {/* Edit button for completed inventories (admin only) */}
          {isTermine && !isEditMode && isAdmin && (
            <Button
              variant="outline"
              size={'icon'}
              onClick={() => setIsEditMode(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {/* Export button */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Télécharger PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2 text-blue-600" />
                Imprimer PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {isTermine && !isEditMode && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold hidden md:inline">Terminé</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit mode banner */}
      {isEditMode && (
        <div className="flex flex-wrap gap-2 items-center w-full md:justify-end">
          <Card className="p-2 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <Edit className="h-5 w-5 text-orange-600" />
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Mode édition activé
              </p>
            </div>
          </Card>

          <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="h-4 w-4 md:mr-2" />
              <span className='hidden md:inline'>Annuler</span>
          </Button>

        </div>

      )}

      {/* Timer et Arrêts */}
      {(() => {
        const tempsTotal = calculatedTempsTotal || inventory.tempsTotal || 0;
        const tempsArret = inventory.tempsArret || 0;
        const tempsUtile = tempsTotal - tempsArret;
        const rendement = tempsTotal > 0 ? (tempsUtile / tempsTotal) * 100 : 0;

        return (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <ProductionTimer
                tempsTotal={tempsTotal}
                totalArrets={tempsArret}
                rendement={rendement}
              />
              {isEnCours && (
                <ArretDialog
                  inventoryId={inventory.id}
                  onArretAdded={handleArretAdded}
                />
              )}
            </div>
          </Card>
        );
      })()}

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
        onComplete={isEditMode ? handleEdit : handleComplete}
        completing={completing}
        disabled={isTermine && !isEditMode}
        onTempsCalculated={setCalculatedTempsTotal}
        isEditMode={isEditMode}
      />

      {/* Cancel edit dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler les modifications ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les modifications non sauvegardées seront perdues. Êtes-vous sûr de vouloir annuler ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l&apos;édition</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelEdit} className="bg-red-600 hover:bg-red-700">
              Annuler les modifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
