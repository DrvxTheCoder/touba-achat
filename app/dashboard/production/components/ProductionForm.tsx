// app/dashboard/production/[id]/ProductionForm/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, CheckCircle, AlertCircle, Edit, Moon } from 'lucide-react';
import { toast } from 'sonner';
import ApproSection from './ApproSection';
import BottlesSection from './BottlesSection';
import ExportsSection from './ExportsSection';
import ReservoirSection from './ReservoirSection';
import AutoCalcs from './AutoCalcs';
import TimeInputSection from './TimeInputSection';
import { ProductionInventory, CompleteInventoryData } from '@/lib/types/production';
import { calculateTonnage } from '@/lib/types/production';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface ProductionFormProps {
  inventory: ProductionInventory;
  onAutoSave: (data: any) => Promise<string | null>;
  onComplete: (data: CompleteInventoryData) => Promise<void>;
  completing: boolean;
  disabled: boolean;
  onTempsCalculated?: (temps: number) => void;
  isEditMode?: boolean;
}

export default function ProductionForm({
  inventory,
  onAutoSave,
  onComplete,
  completing,
  disabled,
  onTempsCalculated,
  isEditMode = false
}: ProductionFormProps) {
  // Transform reservoirs from Prisma format (with 6 input + 6 calculated fields) to component format
  const transformedReservoirs = (inventory.reservoirs || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    reservoirConfigId: s.reservoirConfigId,
    // 6 input fields
    hauteur: s.hauteur || 0,
    temperature: s.temperature || 20,
    temperatureVapeur: s.temperatureVapeur || 20,
    volumeLiquide: s.volumeLiquide || 0,
    pressionInterne: s.pressionInterne || 0,
    densiteA15C: s.densiteA15C || 0,
    tankPercentage: s.tankPercentage || 0,
    // 6 calculated fields (optional, will be recalculated in UI)
    facteurCorrectionLiquide: s.facteurCorrectionLiquide,
    facteurCorrectionVapeur: s.facteurCorrectionVapeur,
    densiteAmbiante: s.densiteAmbiante,
    poidsLiquide: s.poidsLiquide,
    poidsGaz: s.poidsGaz,
    poidsTotal: s.poidsTotal
  }));

  // Initialize dynamic values from inventory - load saved values if they exist
  const initApproValues = () => {
    const values: Record<string, number> = {};
    // Load from saved approValues
    if (inventory.approValues && Array.isArray(inventory.approValues)) {
      inventory.approValues.forEach((av: any) => {
        values[av.fieldConfig.name] = av.value;
      });
    }
    // Fallback to legacy fields for backward compatibility
    if (Object.keys(values).length === 0) {
      if (inventory.butanier != null) values.butanier = inventory.butanier;
      if (inventory.recuperation != null) values.recuperation = inventory.recuperation;
      if (inventory.approSAR != null) values.approSAR = inventory.approSAR;
    }
    return values;
  };

  const initSortieValues = () => {
    const values: Record<string, number> = {};
    // Load from saved sortieValues
    if (inventory.sortieValues && Array.isArray(inventory.sortieValues)) {
      inventory.sortieValues.forEach((sv: any) => {
        values[sv.fieldConfig.name] = sv.value;
      });
    }
    // Fallback to legacy fields for backward compatibility
    if (Object.keys(values).length === 0) {
      if (inventory.ngabou != null) values.ngabou = inventory.ngabou;
      if (inventory.exports != null) values.exports = inventory.exports;
      if (inventory.divers != null) values.divers = inventory.divers;
    }
    return values;
  };

  const [formData, setFormData] = useState({
    approValues: initApproValues(),
    sortieValues: initSortieValues(),
    observations: inventory.observations || '',
    heureDebut: inventory.heureDebut || '',
    heureFin: inventory.heureFin || '',
    bottles: inventory.bottles || [],
    reservoirs: transformedReservoirs,
    densiteAmbiante: (inventory as any).densiteAmbiante || 0,
    // QDN fields
    isQuartDeNuit: inventory.isQuartDeNuit || false,
    quartDeNuitTHT: inventory.quartDeNuitTHT || 0,
    quartDeNuitTA: inventory.quartDeNuitTA || 0,
    quartDeNuitLineIds: (inventory.quartDeNuitLines || []).map((ql: any) => ql.lineId) as number[],
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<string>('');

  // Fetch production lines for the centre
  const [productionLines, setProductionLines] = useState<Array<{ id: number; name: string; capacityPerHour: number; isActive: boolean }>>([]);
  useEffect(() => {
    if (inventory.productionCenterId) {
      fetch(`/api/production/settings/centers/${inventory.productionCenterId}/lines`)
        .then(res => res.ok ? res.json() : [])
        .then(lines => setProductionLines(lines.filter((l: any) => l.isActive)))
        .catch(() => setProductionLines([]));
    }
  }, [inventory.productionCenterId]);

  // Auto-save toutes les 30 secondes si des changements (désactivé en mode édition)
  useEffect(() => {
    if (disabled || isEditMode) return;

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
  }, [formData, disabled, isEditMode]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAutoSaveStatus('idle');
  };

  const updateApproValue = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      approValues: { ...prev.approValues, [field]: value }
    }));
    setAutoSaveStatus('idle');
  };

  const updateSortieValue = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      sortieValues: { ...prev.sortieValues, [field]: value }
    }));
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

  // Calculate temps total from heureDebut and heureFin
  const calculateTempsTotal = (debut: string, fin: string): number => {
    if (!debut || !fin) return 0;

    const [debutH, debutM] = debut.split(':').map(Number);
    const [finH, finM] = fin.split(':').map(Number);

    const debutMinutes = debutH * 60 + debutM;
    let finMinutes = finH * 60 + finM;

    // Handle case where end time is next day (e.g., 23:00 to 02:00)
    if (finMinutes < debutMinutes) {
      finMinutes += 24 * 60; // Add 24 hours
    }

    return finMinutes - debutMinutes;
  };

  const tempsTotal = calculateTempsTotal(formData.heureDebut, formData.heureFin);

  // Notify parent component of calculated time
  useEffect(() => {
    if (onTempsCalculated) {
      onTempsCalculated(tempsTotal);
    }
  }, [tempsTotal, onTempsCalculated]);

  // Toggle QDN line selection
  const toggleQDNLine = (lineId: number) => {
    setFormData(prev => {
      const ids = prev.quartDeNuitLineIds.includes(lineId)
        ? prev.quartDeNuitLineIds.filter(id => id !== lineId)
        : [...prev.quartDeNuitLineIds, lineId];
      return { ...prev, quartDeNuitLineIds: ids };
    });
    setAutoSaveStatus('idle');
  };

  // Calculate QDN cumul sortie from NUIT bottles
  const qdnCumulSortie = formData.bottles
    .filter(b => b.shift === 'NUIT')
    .reduce((sum, b) => sum + calculateTonnage(b.type, b.quantity || 0), 0);

  // Calculate QDN rendement horaire
  const qdnTempsUtile = (formData.quartDeNuitTHT || 0) - (formData.quartDeNuitTA || 0);
  const qdnRendement = qdnTempsUtile > 0 && qdnCumulSortie > 0
    ? qdnCumulSortie / (qdnTempsUtile / 60)
    : 0;

  // Calculate total selected QDN lines capacity
  const qdnLinesCapacity = formData.quartDeNuitLineIds.reduce((sum, lineId) => {
    const line = productionLines.find(l => l.id === lineId);
    return sum + (line?.capacityPerHour || 0);
  }, 0);

  // Calculs automatiques (JOUR shift only)
  const remplissageTotal = formData.bottles
    .filter(b => !b.shift || b.shift === 'JOUR')
    .reduce((sum, b) => sum + calculateTonnage(b.type, b.quantity || 0), 0);

  // Calculate total approvisionnement from dynamic values
  const totalAppro = Object.values(formData.approValues).reduce((sum, val) => sum + val, 0);

  // Calculate total sorties from dynamic values
  const totalSorties = Object.values(formData.sortieValues).reduce((sum, val) => sum + val, 0);

  const stockFinalTheorique =
    inventory.stockInitialPhysique -
    (formData.isQuartDeNuit ? qdnCumulSortie : 0) +
    totalAppro -
    totalSorties -
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
    if (!formData.heureDebut || !formData.heureFin) {
      toast.error('Veuillez renseigner les heures de début et de fin');
      return;
    }

    if (tempsTotal === 0) {
      toast.error('Le temps total de production ne peut pas être zéro');
      return;
    }

    // if (!formData.bottles.length) {
    //   toast.error('Veuillez renseigner au moins une bouteille');
    //   return;
    // }

    // if (!formData.reservoirs.length) {
    //   toast.error('Veuillez renseigner au moins un réservoir');
    //   return;
    // }

    // if (remplissageTotal === 0) {
    //   toast.error('Le remplissage total ne peut pas être zéro');
    //   return;
    // }

    // Vérification de l'écart
    if (Math.abs(ecartPourcentage) > 5) {
      const confirm = window.confirm(
        `L'écart est de ${ecartPourcentage.toFixed(2)}% (>5%). Voulez-vous continuer ?`
      );
      if (!confirm) return;
    }

    const completeData: CompleteInventoryData = {
      // Keep legacy fields for backward compatibility (set to 0 as they're now dynamic)
      butanier: 0,
      recuperation: 0,
      approSAR: 0,
      ngabou: 0,
      exports: 0,
      divers: 0,
      // Add dynamic values
      approValues: formData.approValues,
      sortieValues: formData.sortieValues,
      stockFinalPhysique,
      observations: formData.observations,
      heureDebut: formData.heureDebut,
      heureFin: formData.heureFin,
      tempsTotal,
      bottles: formData.bottles.map(b => ({
        type: b.type,
        quantity: b.quantity || 0,
        shift: b.shift || 'JOUR',
      })),
      // QDN data
      isQuartDeNuit: formData.isQuartDeNuit,
      quartDeNuitTHT: formData.isQuartDeNuit ? formData.quartDeNuitTHT : undefined,
      quartDeNuitTA: formData.isQuartDeNuit ? formData.quartDeNuitTA : undefined,
      quartDeNuitLineIds: formData.isQuartDeNuit ? formData.quartDeNuitLineIds : undefined,
      densiteAmbiante: formData.densiteAmbiante,
      reservoirs: formData.reservoirs.map((s: any) => ({
        name: s.name,
        reservoirConfigId: s.reservoirConfigId,
        hauteur: s.hauteur || 0,
        temperature: s.temperature || 20,
        temperatureVapeur: s.temperatureVapeur || 20,
        volumeLiquide: s.volumeLiquide || 0,
        pressionInterne: s.pressionInterne || 0,
        densiteA15C: s.densiteA15C || 0,
        tankPercentage: s.tankPercentage || 0,
        poidsLiquide: s.poidsLiquide || 0
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

      {/* Time Input Section */}
      <TimeInputSection
        heureDebut={formData.heureDebut}
        heureFin={formData.heureFin}
        tempsTotal={tempsTotal}
        onUpdate={updateField}
        disabled={disabled}
      />

      {/* Quart de Nuit Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-indigo-500" />
            <div>
              <Label htmlFor="qdn-toggle" className="text-base font-medium cursor-pointer">
                Quart de Nuit
              </Label>
              <p className="text-sm text-muted-foreground">
                Activer pour saisir les données du quart de nuit
              </p>
            </div>
          </div>
          <Switch
            id="qdn-toggle"
            checked={formData.isQuartDeNuit}
            onCheckedChange={(checked) => {
              setFormData(prev => ({ ...prev, isQuartDeNuit: checked }));
              setAutoSaveStatus('idle');
            }}
            disabled={disabled}
          />
        </div>

        {/* QDN Fields - shown when toggle is active */}
        {formData.isQuartDeNuit && (
          <div className="mt-6 space-y-6 border-t pt-6">
            {/* QDN Time fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qdn-tht">Total Heures Travaillées - THT (minutes)</Label>
                <Input
                  id="qdn-tht"
                  type="number"
                  min="0"
                  value={formData.quartDeNuitTHT || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, quartDeNuitTHT: parseInt(e.target.value) || 0 }));
                    setAutoSaveStatus('idle');
                  }}
                  disabled={disabled}
                  placeholder="Ex: 480"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qdn-ta">Total Arrêt - TA (minutes)</Label>
                <Input
                  id="qdn-ta"
                  type="number"
                  min="0"
                  value={formData.quartDeNuitTA || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, quartDeNuitTA: parseInt(e.target.value) || 0 }));
                    setAutoSaveStatus('idle');
                  }}
                  disabled={disabled}
                  placeholder="Ex: 30"
                />
              </div>
            </div>

            {/* QDN Line Selection */}
            {productionLines.length > 0 && (
              <div className="space-y-3">
                <Label>Lignes utilisées</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {productionLines.map(line => (
                    <label
                      key={line.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.quartDeNuitLineIds.includes(line.id)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'hover:bg-muted/50'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.quartDeNuitLineIds.includes(line.id)}
                        onChange={() => !disabled && toggleQDNLine(line.id)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm">{line.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({line.capacityPerHour} T/h)</span>
                      </div>
                    </label>
                  ))}
                </div>
                {formData.quartDeNuitLineIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Capacité totale sélectionnée: <span className="font-semibold">{qdnLinesCapacity} T/h</span>
                  </p>
                )}
              </div>
            )}

            {productionLines.length === 0 && (
              <p className="text-sm text-orange-600">
                Aucune ligne de production configurée pour ce centre. Veuillez configurer les lignes dans les paramètres du centre.
              </p>
            )}

            {/* QDN Metrics Summary */}
            {(qdnCumulSortie > 0 || formData.quartDeNuitTHT > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Cumul Sortie QDN</p>
                  <p className="text-lg font-semibold">{qdnCumulSortie.toFixed(3)} T</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Temps Utile QDN</p>
                  <p className="text-lg font-semibold">{qdnTempsUtile > 0 ? `${Math.floor(qdnTempsUtile / 60)}h${(qdnTempsUtile % 60).toString().padStart(2, '0')}` : '-'}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Rendement QDN</p>
                  <p className="text-lg font-semibold">
                    {qdnRendement > 0 ? `${qdnRendement.toFixed(2)} T/h` : '-'}
                    {qdnRendement > 0 && qdnLinesCapacity > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({((qdnRendement / qdnLinesCapacity) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <Tabs defaultValue="appro" className="w-full">
            <TabsList className={`grid w-full h-fit ${formData.isQuartDeNuit ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
            <TabsTrigger value="appro">Approvisionnement</TabsTrigger>
            <TabsTrigger value="bottles">Bouteilles</TabsTrigger>
            {formData.isQuartDeNuit && (
              <TabsTrigger value="bottles-nuit" className="text-indigo-600">
                <Moon className="h-3 w-3 mr-1" />
                Bouteilles Quart de Nuit
              </TabsTrigger>
            )}
            <TabsTrigger value="exports">Sorties</TabsTrigger>
            <TabsTrigger value="reservoirs">Réservoirs</TabsTrigger>
            </TabsList>

          <TabsContent value="appro" className="space-y-4 mt-6">
            <ApproSection
              stockInitial={inventory.stockInitialPhysique}
              dynamicValues={formData.approValues}
              onUpdate={updateApproValue}
              disabled={disabled}
              productionCenterId={inventory.productionCenterId}
            />
          </TabsContent>

          <TabsContent value="bottles" className="space-y-4 mt-6">
            <BottlesSection
              bottles={formData.bottles}
              onUpdate={updateBottles}
              disabled={disabled}
              shift="JOUR"
            />
          </TabsContent>

          {formData.isQuartDeNuit && (
            <TabsContent value="bottles-nuit" className="space-y-4 mt-6">
              <BottlesSection
                bottles={formData.bottles}
                onUpdate={updateBottles}
                disabled={disabled}
                shift="NUIT"
              />
            </TabsContent>
          )}

          <TabsContent value="exports" className="space-y-4 mt-6">
            <ExportsSection
              dynamicValues={formData.sortieValues}
              onUpdate={updateSortieValue}
              disabled={disabled}
              productionCenterId={inventory.productionCenterId}
            />
          </TabsContent>

          <TabsContent value="reservoirs" className="space-y-4 mt-6">
            <ReservoirSection
              reservoirs={formData.reservoirs as any}
              onUpdate={updateReservoirs}
              disabled={disabled}
              productionCenterId={inventory.productionCenterId}
              densiteAmbiante={formData.densiteAmbiante}
              onDensiteAmbianteChange={(value) => {
                setFormData(prev => ({ ...prev, densiteAmbiante: value }));
                setAutoSaveStatus('idle');
              }}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Calculs automatiques */}
      <AutoCalcs
        stockInitial={inventory.stockInitialPhysique}
        butanier={totalAppro}
        recuperation={0}
        approSAR={0}
        ngabou={totalSorties}
        exports={0}
        divers={0}
        remplissageTotal={remplissageTotal}
        stockFinalTheorique={stockFinalTheorique}
        stockFinalPhysique={stockFinalPhysique}
        ecart={ecart}
        ecartPourcentage={ecartPourcentage}
        qdnCumulSortie={formData.isQuartDeNuit ? qdnCumulSortie : 0}
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
              className={`min-w-[200px] ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
            >
              {completing ? (
                isEditMode ? 'Sauvegarde en cours...' : 'Clôture en cours...'
              ) : isEditMode ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Sauvegarder les modifications
                </>
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