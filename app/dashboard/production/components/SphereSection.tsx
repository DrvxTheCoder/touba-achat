// app/dashboard/production/[id]/ProductionForm/SpheresSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info, Calculator } from 'lucide-react';
import { SPHERE_LABELS } from '@/lib/types/production';
import { SphereType } from '@prisma/client';
import { calculateSphereData, validateSphereInput, SphereInputData, SPHERE_CAPACITIES, calculateLiquidVolumeFromHeight } from '@/lib/utils/sphereCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Sphere {
  id?: number;
  name: string;
  // 5 champs de saisie
  hauteur: number;
  temperature: number;
  volumeLiquide: number;
  pressionInterne: number;
  densiteA15C: number;
  // 6 champs calculés (optionnels pour la UI)
  facteurCorrectionLiquide?: number;
  facteurCorrectionVapeur?: number;
  densiteAmbiante?: number;
  poidsLiquide?: number;
  poidsGaz?: number;
  poidsTotal?: number;
}

interface SpheresSectionProps {
  spheres: Sphere[];
  onUpdate: (spheres: Sphere[]) => void;
  disabled: boolean;
}

export default function SpheresSection({
  spheres,
  onUpdate,
  disabled
}: SpheresSectionProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Initialize spheres if empty with default values
  useEffect(() => {
    if (spheres.length === 0) {
      const initialSpheres: Sphere[] = [
        { name: 'D100', hauteur: 0, temperature: 20, volumeLiquide: 0, pressionInterne: 0, densiteA15C: 0 },
        { name: 'SO2', hauteur: 0, temperature: 20, volumeLiquide: 0, pressionInterne: 0, densiteA15C: 0 },
        { name: 'SO3', hauteur: 0, temperature: 20, volumeLiquide: 0, pressionInterne: 0, densiteA15C: 0 },
      ];
      onUpdate(initialSpheres);
    }
  }, []);

  const updateSphere = (index: number, field: keyof Sphere, value: number) => {
    const updated = [...spheres];
    updated[index] = { ...updated[index], [field]: value };

    // Calculer automatiquement si tous les champs sont remplis
    const sphere = updated[index];
    if (
      sphere.hauteur > 0 &&
      sphere.temperature >= 15.0 &&
      sphere.temperature <= 32.9 &&
      sphere.volumeLiquide > 0 &&
      sphere.pressionInterne >= 0 &&
      sphere.densiteA15C > 0
    ) {
      try {
        // Valider
        const errors = validateSphereInput(sphere as SphereInputData);
        if (errors.length > 0) {
          setValidationErrors({ ...validationErrors, [sphere.name]: errors });
        } else {
          // Supprimer les erreurs si tout est valide
          const newErrors = { ...validationErrors };
          delete newErrors[sphere.name];
          setValidationErrors(newErrors);

          // Calculer
          const calculated = calculateSphereData(sphere as SphereInputData);
          updated[index] = calculated;
        }
      } catch (error: any) {
        setValidationErrors({
          ...validationErrors,
          [sphere.name]: [error.message]
        });
      }
    }

    onUpdate(updated);
  };

  const autoCalculateVolume = (index: number) => {
    const sphere = spheres[index];

    if (sphere.hauteur <= 0) {
      alert('Veuillez d\'abord renseigner la hauteur');
      return;
    }

    try {
      const calculatedVolume = calculateLiquidVolumeFromHeight(sphere.name, sphere.hauteur);
      updateSphere(index, 'volumeLiquide', calculatedVolume);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const totalStockFinal = spheres.reduce((sum, s) => sum + (s.poidsTotal || 0), 0);
  const allSpheresCalculated = spheres.every(s => s.poidsTotal !== undefined && s.poidsTotal > 0);

  // Show loading state while initializing
  if (spheres.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Initialisation des sphères...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pesée des sphères de GPL</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Saisir les 5 mesures pour chaque sphère. Les calculs se font automatiquement.
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
            <strong>💡 Calcul automatique du volume :</strong> Vous pouvez utiliser le bouton calculatrice (<Calculator className="h-3 w-3 inline" />) à côté du volume liquide pour le calculer automatiquement depuis la hauteur (formule de segment sphérique).
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-6">
        {spheres.map((sphere, index) => {
          const hasErrors = validationErrors[sphere.name]?.length > 0;
          const isCalculated = sphere.poidsTotal !== undefined && sphere.poidsTotal > 0;
          const capacity = SPHERE_CAPACITIES[sphere.name];

          return (
            <Card key={sphere.name} className={`p-6 ${hasErrors ? 'border-red-300' : isCalculated ? 'border-green-300' : ''}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xl">
                    {SPHERE_LABELS[sphere.name as SphereType] || sphere.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Capacité: {capacity.toFixed(2)} m³)
                    </span>
                  </h4>
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
                      value={sphere.hauteur}
                      onChange={(e) => updateSphere(index, 'hauteur', parseFloat(e.target.value) || 0)}
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
                      value={sphere.temperature}
                      onChange={(e) => updateSphere(index, 'temperature', parseFloat(e.target.value) || 20)}
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
                        value={sphere.volumeLiquide}
                        onChange={(e) => updateSphere(index, 'volumeLiquide', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        className="font-mono flex-1"
                        placeholder="0.000"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => autoCalculateVolume(index)}
                        disabled={disabled || sphere.hauteur <= 0}
                        title="Calculer automatiquement depuis la hauteur"
                        className="shrink-0"
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
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
                      value={sphere.pressionInterne}
                      onChange={(e) => updateSphere(index, 'pressionInterne', parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className="font-mono"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Densité à 15°C */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Densité à 15°C
                      <span className="text-xs text-muted-foreground ml-1">- SAR </span>
                    </Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.4"
                      max="0.6"
                      value={sphere.densiteA15C}
                      onChange={(e) => updateSphere(index, 'densiteA15C', parseFloat(e.target.value) || 0.508)}
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
                        {validationErrors[sphere.name].map((error, i) => (
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
                        <div className="font-mono font-semibold">{sphere.facteurCorrectionLiquide?.toFixed(5)}</div>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <div className="text-muted-foreground">Facteur correction vapeur</div>
                        <div className="font-mono font-semibold">{sphere.facteurCorrectionVapeur?.toFixed(5)}</div>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <div className="text-muted-foreground">Densité ambiante</div>
                        <div className="font-mono font-semibold">{sphere.densiteAmbiante?.toFixed(5)}</div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded">
                        <div className="text-muted-foreground">Poids liquide</div>
                        <div className="font-mono font-bold text-blue-700 dark:text-blue-300">
                          {sphere.poidsLiquide?.toFixed(3)} T
                        </div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded">
                        <div className="text-muted-foreground">Poids gaz</div>
                        <div className="font-mono font-bold text-blue-700 dark:text-blue-300">
                          {sphere.poidsGaz?.toFixed(3)} T
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-950 p-3 rounded">
                        <div className="text-muted-foreground font-semibold">POIDS TOTAL</div>
                        <div className="font-mono font-bold text-lg text-green-700 dark:text-green-300">
                          {sphere.poidsTotal?.toFixed(3)} T
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
      <Card className={`p-6 ${allSpheresCalculated ? 'bg-green-50 dark:bg-green-950/30 border-green-300' : 'bg-muted'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg">Stock Final Physique (Total)</h4>
            <p className="text-xs text-muted-foreground">Somme des poids totaux des 3 sphères</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${allSpheresCalculated ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {totalStockFinal.toFixed(3)} T
            </div>
            {allSpheresCalculated && (
              <div className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1 mt-1">
                <CheckCircle className="h-3 w-3" />
                Toutes les sphères calculées
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
        <p>• Stock Final Physique = Somme des poids totaux des 3 sphères</p>
      </div>
    </div>
  );
}
