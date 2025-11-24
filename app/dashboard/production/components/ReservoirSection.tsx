'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info, Calculator } from 'lucide-react';
import { calculateSphereData, validateSphereInput, SphereInputData } from '@/lib/utils/sphereCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ReservoirType } from '@prisma/client';

interface ReservoirConfig {
  id: number;
  name: string;
  type: ReservoirType;
  capacity: number;
}

interface Reservoir {
  id?: number;
  name: string;
  reservoirConfigId?: number;
  // 5 champs de saisie
  hauteur: number;
  temperature: number;
  volumeLiquide: number;
  pressionInterne: number;
  densiteA15C: number;
  // 6 champs calculés
  facteurCorrectionLiquide?: number;
  facteurCorrectionVapeur?: number;
  densiteAmbiante?: number;
  poidsLiquide?: number;
  poidsGaz?: number;
  poidsTotal?: number;
}

interface ReservoirsSectionProps {
  reservoirs: Reservoir[];
  onUpdate: (reservoirs: Reservoir[]) => void;
  disabled: boolean;
  productionCenterId?: number | null;
}

export default function ReservoirSection({
  reservoirs,
  onUpdate,
  disabled,
  productionCenterId
}: ReservoirsSectionProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [reservoirConfigs, setReservoirConfigs] = useState<ReservoirConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reservoir configurations from API
  useEffect(() => {
    const fetchReservoirConfigs = async () => {
      try {
        const url = productionCenterId
          ? `/api/production/settings/reservoirs?centerId=${productionCenterId}`
          : '/api/production/settings/reservoirs';

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setReservoirConfigs(data);

          // Initialize reservoirs if empty
          if (reservoirs.length === 0 && data.length > 0) {
            const initialReservoirs: Reservoir[] = data.map((config: ReservoirConfig) => ({
              name: config.name,
              reservoirConfigId: config.id,
              hauteur: 0,
              temperature: 20,
              volumeLiquide: 0,
              pressionInterne: 0,
              densiteA15C: 0,
            }));
            onUpdate(initialReservoirs);
          }
        }
      } catch (error) {
        console.error('Error fetching reservoir configs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservoirConfigs();
  }, [productionCenterId]);

  const updateReservoir = (index: number, field: keyof Reservoir, value: number) => {
    const updated = [...reservoirs];
    updated[index] = { ...updated[index], [field]: value };

    // Calculer automatiquement si tous les champs sont remplis
    const reservoir = updated[index];
    if (
      reservoir.hauteur > 0 &&
      reservoir.temperature >= 15.0 &&
      reservoir.temperature <= 32.9 &&
      reservoir.volumeLiquide > 0 &&
      reservoir.pressionInterne >= 0 &&
      reservoir.densiteA15C > 0
    ) {
      try {
        // Valider
        const errors = validateSphereInput(reservoir as SphereInputData);
        if (errors.length > 0) {
          setValidationErrors({ ...validationErrors, [reservoir.name]: errors });
        } else {
          // Supprimer les erreurs si tout est valide
          const newErrors = { ...validationErrors };
          delete newErrors[reservoir.name];
          setValidationErrors(newErrors);

          // Calculer
          const calculated = calculateSphereData(reservoir as SphereInputData);
          updated[index] = {
            ...reservoir,
            ...calculated,
          };
        }
      } catch (error: any) {
        setValidationErrors({
          ...validationErrors,
          [reservoir.name]: [error.message],
        });
      }
    }

    onUpdate(updated);
  };

  const autoCalculateVolume = (index: number) => {
    const reservoir = reservoirs[index];
    const config = reservoirConfigs.find(c => c.id === reservoir.reservoirConfigId);

    // Check if reservoir type is CIGARE - disable auto-calculation
    if (config?.type === 'CIGARE') {
      alert('Le calcul automatique du volume est désactivé pour les réservoirs de type CIGARE. Veuillez saisir le volume manuellement.');
      return;
    }

    if (reservoir.hauteur <= 0) {
      alert('Veuillez d\'abord renseigner la hauteur');
      return;
    }

    try {
      // Use the capacity from the config for calculation
      const capacity = config?.capacity;
      if (!capacity) {
        throw new Error('Capacité du réservoir non trouvée');
      }

      // Calculate volume using spherical segment formula
      const liquidHeightM = reservoir.hauteur / 1000;
      const radius = Math.cbrt((3 * capacity) / (4 * Math.PI));
      const h = liquidHeightM;
      const calculatedVolume = (Math.PI * h * h * (3 * radius - h)) / 3;

      updateReservoir(index, 'volumeLiquide', calculatedVolume);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const totalStockFinal = reservoirs.reduce((sum, r) => sum + (r.poidsTotal || 0), 0);
  const allReservoirsCalculated = reservoirs.every(r => r.poidsTotal !== undefined && r.poidsTotal > 0);

  // Show loading state while fetching configs
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Chargement des configurations de réservoirs...</div>
      </div>
    );
  }

  // Show message if no reservoir configs found
  if (reservoirConfigs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-muted-foreground">Aucun réservoir configuré pour ce centre.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Veuillez configurer des réservoirs dans les paramètres.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while initializing reservoirs
  if (reservoirs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Initialisation des réservoirs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pesée des réservoirs de GPL</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Saisir les 5 mesures pour chaque réservoir. Les calculs se font automatiquement.
        </p>
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Sources des données :</strong>
            <br />
            • <strong>Hauteur, Température, Volume liquide & Pression interne :</strong> Application Entis XL (mesures en temps réel)
            <br />
            • <strong>Densité à 15°C :</strong> Fourni par la SAR (après analyse en laboratoire)
            <br />
            <br />
            <strong>💡 Calcul automatique du volume :</strong> Pour les réservoirs sphériques, vous pouvez utiliser le bouton calculatrice (<Calculator className="h-3 w-3 inline" />) pour calculer automatiquement le volume depuis la hauteur. Cette fonction est désactivée pour les réservoirs de type CIGARE.
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-6">
        {reservoirs.map((reservoir, index) => {
          const hasErrors = validationErrors[reservoir.name]?.length > 0;
          const isCalculated = reservoir.poidsTotal !== undefined && reservoir.poidsTotal > 0;
          const config = reservoirConfigs.find(c => c.id === reservoir.reservoirConfigId);
          const capacity = config?.capacity || 0;
          const isCigare = config?.type === 'CIGARE';

          return (
            <Card key={reservoir.name} className={`p-6 ${hasErrors ? 'border-red-300' : isCalculated ? 'border-green-300' : ''}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-xl">
                      {reservoir.name}
                    </h4>
                    {config && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        config.type === 'SPHERE' ? 'bg-blue-100 text-blue-800' :
                        config.type === 'CIGARE' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {config.type}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      (Capacité: {capacity.toFixed(2)} m³)
                    </span>
                  </div>
                  {isCalculated && !hasErrors && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {hasErrors && (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>

                {/* 5 champs de saisie */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Hauteur */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Hauteur (mm)
                      <span className="text-xs text-muted-foreground ml-1">- Entis XL</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="30000"
                      value={reservoir.hauteur}
                      onChange={(e) => updateReservoir(index, 'hauteur', parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className="font-mono"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Température */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Température (°C)
                      <span className="text-xs text-muted-foreground ml-1">- Entis XL</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="15.0"
                      max="32.9"
                      value={reservoir.temperature}
                      onChange={(e) => updateReservoir(index, 'temperature', parseFloat(e.target.value) || 20)}
                      disabled={disabled}
                      className="font-mono"
                      placeholder="20.0"
                    />
                  </div>

                  {/* Volume liquide */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Volume liquide (m³)
                      <span className="text-xs text-muted-foreground ml-1">- Entis XL</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        max={capacity}
                        value={reservoir.volumeLiquide.toFixed(3)}
                        onChange={(e) => updateReservoir(index, 'volumeLiquide', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        className="font-mono flex-1"
                        placeholder="0.000"
                      />
                      {!isCigare && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => autoCalculateVolume(index)}
                          disabled={disabled || reservoir.hauteur <= 0}
                          title="Calculer automatiquement depuis la hauteur"
                          className="shrink-0"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {isCigare && (
                      <p className="text-xs text-muted-foreground">
                        Calcul auto désactivé pour type CIGARE
                      </p>
                    )}
                  </div>

                  {/* Pression interne */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Pression interne (bar)
                      <span className="text-xs text-muted-foreground ml-1">- Entis XL</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={reservoir.pressionInterne}
                      onChange={(e) => updateReservoir(index, 'pressionInterne', parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className="font-mono"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Densité à 15°C */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Densité à 15°C
                      <span className="text-xs text-muted-foreground ml-1">- SAR</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.4"
                      max="0.6"
                      value={reservoir.densiteA15C}
                      onChange={(e) => updateReservoir(index, 'densiteA15C', parseFloat(e.target.value) || 0.508)}
                      disabled={disabled}
                      className="font-mono"
                      placeholder="0.508"
                    />
                  </div>
                </div>

                {/* Affichage des erreurs de validation */}
                {hasErrors && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-xs">
                        {validationErrors[reservoir.name].map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Affichage des résultats calculés */}
                {isCalculated && !hasErrors && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-semibold mb-3 text-blue-600 dark:text-blue-400">
                      📊 Résultats calculés automatiquement
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-muted p-2 rounded">
                        <div className="text-muted-foreground">Facteur correction liquide</div>
                        <div className="font-mono font-semibold">{reservoir.facteurCorrectionLiquide?.toFixed(5)}</div>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <div className="text-muted-foreground">Facteur correction vapeur</div>
                        <div className="font-mono font-semibold">{reservoir.facteurCorrectionVapeur?.toFixed(5)}</div>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <div className="text-muted-foreground">Densité ambiante</div>
                        <div className="font-mono font-semibold">{reservoir.densiteAmbiante?.toFixed(5)}</div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded">
                        <div className="text-muted-foreground">Poids liquide</div>
                        <div className="font-mono font-bold text-blue-700 dark:text-blue-300">
                          {reservoir.poidsLiquide?.toFixed(3)} T
                        </div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded">
                        <div className="text-muted-foreground">Poids gaz</div>
                        <div className="font-mono font-bold text-blue-700 dark:text-blue-300">
                          {reservoir.poidsGaz?.toFixed(3)} T
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-950 p-3 rounded">
                        <div className="text-muted-foreground font-semibold">POIDS TOTAL</div>
                        <div className="font-mono font-bold text-lg text-green-700 dark:text-green-300">
                          {reservoir.poidsTotal?.toFixed(3)} T
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Total stock final physique */}
      <Card className={`p-6 ${allReservoirsCalculated ? 'bg-green-50 dark:bg-green-950/30 border-green-300' : 'bg-muted'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg">Stock Final Physique (Total)</h4>
            <p className="text-xs text-muted-foreground">Somme des poids totaux de tous les réservoirs</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${allReservoirsCalculated ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {totalStockFinal.toFixed(3)} T
            </div>
            {allReservoirsCalculated && (
              <div className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1 mt-1">
                <CheckCircle className="h-3 w-3" />
                Tous les réservoirs calculés
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded">
        <p className="font-semibold">ℹ️ Formules de calcul :</p>
        <p>• Les facteurs de correction sont interpolés depuis une table de 121 températures (15.0°C - 32.9°C)</p>
        <p>• Densité ambiante = Densité à 15°C - Facteur correction liquide</p>
        <p>• Poids liquide = Densité ambiante × Volume liquide</p>
        <p>• Poids gaz = (Capacité - Volume liquide) × Facteur correction gaz × (Pression + 1)</p>
        <p>• Poids total = Poids liquide + Poids gaz</p>
        <p>• Stock Final Physique = Somme des poids totaux de tous les réservoirs</p>
      </div>
    </div>
  );
}
