// app/dashboard/production/[id]/ProductionForm/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ApproSection from './ApproSection';
import BottlesSection from './BottlesSection';
import ExportsSection from './ExportsSection';
import ReservoirSection from './ReservoirSection';
import AutoCalcs from './AutoCalcs';
import { ProductionInventory, CompleteInventoryData } from '@/lib/types/production';
import { calculateTonnage } from '@/lib/types/production';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProductionFormProps {
  inventory: ProductionInventory;
  onAutoSave: (data: any) => Promise<string | null>;
  onComplete: (data: CompleteInventoryData) => Promise<void>;
  completing: boolean;
  disabled: boolean;
}

export default function ProductionForm({
  inventory,
  onAutoSave,
  onComplete,
  completing,
  disabled
}: ProductionFormProps) {
  // Transform reservoirs from Prisma format (with 5 input + 6 calculated fields) to component format
  const transformedReservoirs = (inventory.reservoirs || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    reservoirConfigId: s.reservoirConfigId,
    // 5 input fields
    hauteur: s.hauteur || 0,
    temperature: s.temperature || 20,
    volumeLiquide: s.volumeLiquide || 0,
    pressionInterne: s.pressionInterne || 0,
    densiteA15C: s.densiteA15C || 0,
    // 6 calculated fields (optional, will be recalculated in UI)
    facteurCorrectionLiquide: s.facteurCorrectionLiquide,
    facteurCorrectionVapeur: s.facteurCorrectionVapeur,
    densiteAmbiante: s.densiteAmbiante,
    poidsLiquide: s.poidsLiquide,
    poidsGaz: s.poidsGaz,
    poidsTotal: s.poidsTotal
  }));

  const [formData, setFormData] = useState({
    butanier: inventory.butanier || 0,
    recuperation: inventory.recuperation || 0,
    approSAR: inventory.approSAR || 0,
    ngabou: inventory.ngabou || 0,
    exports: inventory.exports || 0,
    divers: inventory.divers || 0,
    observations: inventory.observations || '',
    bottles: inventory.bottles || [],
    reservoirs: transformedReservoirs
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<string>('');

  // Auto-save toutes les 30 secondes si des changements
  useEffect(() => {
    if (disabled) return;

    const timer = setTimeout(async () => {
      if (autoSaveStatus === 'idle') {
        setAutoSaveStatus('saving');
        const savedAt = await onAutoSave(formData);
        if (savedAt) {
          setAutoSaveStatus('saved');
          setLastSaved(savedAt);
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('idle');
        }
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [formData, disabled]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAutoSaveStatus('idle');
  };

  const updateBottles = (bottles: any[]) => {
    setFormData(prev => ({ ...prev, bottles }));
    setAutoSaveStatus('idle');
  };

  const updateReservoirs = (reservoirs: any[]) => {
    setFormData(prev => ({ ...prev, reservoirs }));
    setAutoSaveStatus('idle');
  };

  // Calculs automatiques
  const remplissageTotal = formData.bottles.reduce(
    (sum, b) => {
      const tonnage = calculateTonnage(b.type, b.quantity || 0);
      return sum + tonnage;
    },
    0
  );

  const stockFinalTheorique =
    inventory.stockInitialPhysique +
    formData.butanier +
    formData.recuperation +
    formData.approSAR -
    formData.ngabou -
    formData.exports -
    formData.divers -
    remplissageTotal;

  const stockFinalPhysique = formData.reservoirs.reduce(
    (sum, s) => {
      const poids = parseFloat((s as any).poidsLiquide) || 0;
      return sum + poids;
    },
    0
  );

  const ecart = stockFinalPhysique - stockFinalTheorique;
  const ecartPourcentage =
    stockFinalTheorique !== 0 ? (ecart / stockFinalTheorique) * 100 : 0;

  const handleComplete = async () => {
    // Validation
    if (!formData.bottles.length) {
      toast.error('Veuillez renseigner au moins une bouteille');
      return;
    }

    if (!formData.reservoirs.length) {
      toast.error('Veuillez renseigner au moins un réservoir');
      return;
    }

    if (remplissageTotal === 0) {
      toast.error('Le remplissage total ne peut pas être zéro');
      return;
    }

    // Vérification de l'écart
    if (Math.abs(ecartPourcentage) > 5) {
      const confirm = window.confirm(
        `L'écart est de ${ecartPourcentage.toFixed(2)}% (>5%). Voulez-vous continuer ?`
      );
      if (!confirm) return;
    }

    const completeData: CompleteInventoryData = {
      butanier: formData.butanier,
      recuperation: formData.recuperation,
      approSAR: formData.approSAR,
      ngabou: formData.ngabou,
      exports: formData.exports,
      divers: formData.divers,
      stockFinalPhysique,
      observations: formData.observations,
      bottles: formData.bottles.map(b => ({
        type: b.type,
        quantity: b.quantity || 0
      })),
      reservoirs: formData.reservoirs.map((s: any) => ({
        name: s.name,
        reservoirConfigId: s.reservoirConfigId,
        hauteur: s.hauteur || 0,
        temperature: s.temperature || 20,
        volumeLiquide: s.volumeLiquide || 0,
        pressionInterne: s.pressionInterne || 0,
        densiteA15C: s.densiteA15C || 0
      }))
    };

    await onComplete(completeData);
  };

  return (
    <div className="space-y-6">
      {/* Auto-save status */}
      {!disabled && (
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-2">
              <Save className="h-3 w-3 animate-pulse" />
              Sauvegarde en cours...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Sauvegardé à {new Date(lastSaved).toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      )}

      <Card className="p-6">
        <Tabs defaultValue="appro" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appro">Approvisionnement</TabsTrigger>
            <TabsTrigger value="bottles">Bouteilles</TabsTrigger>
            <TabsTrigger value="exports">Sorties</TabsTrigger>
            <TabsTrigger value="reservoirs">Réservoirs</TabsTrigger>
          </TabsList>

          <TabsContent value="appro" className="space-y-4 mt-6">
            <ApproSection
              stockInitial={inventory.stockInitialPhysique}
              butanier={formData.butanier}
              recuperation={formData.recuperation}
              approSAR={formData.approSAR}
              onUpdate={updateField}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="bottles" className="space-y-4 mt-6">
            <BottlesSection
              bottles={formData.bottles}
              onUpdate={updateBottles}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="exports" className="space-y-4 mt-6">
            <ExportsSection
              ngabou={formData.ngabou}
              exports={formData.exports}
              divers={formData.divers}
              onUpdate={updateField}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="reservoirs" className="space-y-4 mt-6">
            <ReservoirSection
              reservoirs={formData.reservoirs as any}
              onUpdate={updateReservoirs}
              disabled={disabled}
              productionCenterId={inventory.productionCenterId}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Calculs automatiques */}
      <AutoCalcs
        stockInitial={inventory.stockInitialPhysique}
        butanier={formData.butanier}
        recuperation={formData.recuperation}
        approSAR={formData.approSAR}
        ngabou={formData.ngabou}
        exports={formData.exports}
        divers={formData.divers}
        remplissageTotal={remplissageTotal}
        stockFinalTheorique={stockFinalTheorique}
        stockFinalPhysique={stockFinalPhysique}
        ecart={ecart}
        ecartPourcentage={ecartPourcentage}
      />

      {/* Observations */}
      <Card className="p-6">
        <div className="space-y-2">
          <Label htmlFor="observations">Observations</Label>
          <Textarea
            id="observations"
            placeholder="Observations et remarques..."
            value={formData.observations}
            onChange={(e) => updateField('observations', e.target.value)}
            disabled={disabled}
            rows={4}
          />
        </div>
      </Card>

      {/* Actions */}
      {!disabled && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {Math.abs(ecartPourcentage) > 5 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Attention: Écart supérieur à 5%</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleComplete}
              disabled={completing}
              size="lg"
              className="min-w-[200px]"
            >
              {completing ? (
                'Clôture en cours...'
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Clôturer l&apos;inventaire
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}