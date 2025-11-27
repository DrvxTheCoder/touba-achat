# 🔄 MISE À JOUR MODULE PRODUCTION - CALCULS ENRICHIS DES SPHÈRES (VERSION FINALE)

## 🎯 OBJECTIF

Enrichir le module Production pour calculer automatiquement les poids des sphères à partir des données techniques complètes, en utilisant la **vraie table de facteurs de correction** fournie par le Chef de Production.

---

## 📊 DONNÉES DISPONIBLES

### ✅ Table Complète de Facteurs de Correction

**109 températures** de **15.1°C à 35.3°C** extraites du fichier officiel `FACTEUR_DE_CORRECTION_DENSITES.xlsx`

Exemples :
- 15.1°C : Liquide 0.000100, Gaz 0.002448
- 27.1°C : Liquide 0.014000, Gaz 0.002330
- 29.5°C : Liquide 0.016800, Gaz 0.002307
- 35.3°C : Liquide 0.020700, Gaz 0.002277

---

## 🔬 FORMULES DE CALCUL

### Données à Saisir (par sphère)

Pour chaque sphère (D100, SO2, SO3), le chef saisit :

1. **Hauteur** (mm) - depuis Entis XL
2. **Température** (°C) - depuis Entis XL
3. **Volume Liquide** (m³) - depuis Entis XL
4. **Pression Interne** (bar) - mesure manuelle
5. **Densité à 15°C** - fournie par SAR (Société Africaine de Raffinage)

### Calculs Automatiques

```javascript
// 1. Obtenir facteurs de correction selon température (interpolation)
{facteurLiquide, facteurGaz} = getCorrectionFactors(temperature)

// 2. Densité Ambiante
densiteAmbiante = densiteA15C - facteurLiquide

// 3. Poids Liquide (tonnes)
poidsLiquide = densiteAmbiante × volumeLiquide

// 4. Poids Gaz (tonnes)
volumeGaz = capaciteSphere - volumeLiquide
poidsGaz = volumeGaz × facteurGaz × (pressionInterne + 1)

// 5. Poids Total (tonnes)
poidsSphere = poidsLiquide + poidsGaz
```

### Constantes - Capacités des Sphères

```typescript
const SPHERE_CAPACITIES = {
  D100: 3304.491,  // m³
  SO2: 3297.610,   // m³
  SO3: 3324.468    // m³
};
```

---

## 📝 FICHIERS À CRÉER/MODIFIER

### ÉTAPE 1 : Schéma Prisma

**Fichier :** `prisma/schema.prisma`

```prisma
// Modifier le modèle Sphere existant
model Sphere {
  id                    Int                  @id @default(autoincrement())
  inventoryId           Int
  inventory             ProductionInventory  @relation(fields: [inventoryId], references: [id], onDelete: Cascade)
  
  name                  SphereType           // D100, SO2, SO3
  
  // === DONNÉES SAISIES MANUELLEMENT ===
  hauteur               Float                // En mm (depuis Entis XL)
  temperature           Float                // En °C (depuis Entis XL)
  volumeLiquide         Float                // En m³ (depuis Entis XL)
  pressionInterne       Float                // En bar (mesure manuelle)
  densiteA15C           Float                // Densité à 15°C (fournie par SAR)
  
  // === VALEURS CALCULÉES AUTOMATIQUEMENT ===
  facteurCorrectionLiquide  Float            // De la table
  facteurCorrectionGaz      Float            // De la table
  densiteAmbiante       Float                // Calculé
  poidsLiquide          Float                // Calculé (tonnes)
  poidsGaz              Float                // Calculé (tonnes)
  poids                 Float                // Total = liquide + gaz (tonnes)
  
  @@unique([inventoryId, name])
}

// Nouvelle table pour les facteurs de correction
model CorrectionFactorTable {
  id                    Int      @id @default(autoincrement())
  temperature           Float    @unique
  facteurLiquide        Float
  facteurGaz            Float
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([temperature])
}

// Vérifier que SphereType est correct
enum SphereType {
  D100    // Capacité: 3304.491 m³
  SO2     // Capacité: 3297.610 m³
  SO3     // Capacité: 3324.468 m³
}
```

**Migration :**
```bash
npx prisma migrate dev --name enrich_sphere_calculations
npx prisma generate
```

---

### ÉTAPE 2 : Table de Facteurs de Correction

**Fichier :** `lib/data/correctionFactors.ts` (NOUVEAU)

📄 **Utilise le fichier `correctionFactors.ts` que j'ai créé dans `/mnt/user-data/outputs/`**

Ce fichier contient :
- ✅ Les 109 températures
- ✅ La fonction `getCorrectionFactors(temperature)` avec interpolation
- ✅ L'interface TypeScript

**Copie ce fichier dans ton projet :**
```bash
cp /path/to/correctionFactors.ts lib/data/correctionFactors.ts
```

---

### ÉTAPE 3 : Fonctions de Calcul des Sphères

**Fichier :** `lib/utils/sphereCalculations.ts` (NOUVEAU)

```typescript
// lib/utils/sphereCalculations.ts
import { getCorrectionFactors } from '@/lib/data/correctionFactors';

export type SphereType = 'D100' | 'SO2' | 'SO3';

// Capacités des sphères (en m³)
export const SPHERE_CAPACITIES: Record<SphereType, number> = {
  D100: 3304.491,
  SO2: 3297.610,
  SO3: 3324.468
};

/**
 * Interface pour les données de saisie d'une sphère
 */
export interface SphereInputData {
  name: SphereType;
  hauteur: number;          // mm
  temperature: number;      // °C
  volumeLiquide: number;    // m³
  pressionInterne: number;  // bar
  densiteA15C: number;      // densité à 15°C (fournie par SAR)
}

/**
 * Interface pour les résultats calculés
 */
export interface SphereCalculatedData extends SphereInputData {
  facteurCorrectionLiquide: number;
  facteurCorrectionGaz: number;
  densiteAmbiante: number;
  poidsLiquide: number;     // tonnes
  poidsGaz: number;         // tonnes
  poids: number;            // tonnes (total)
}

/**
 * Calculer tous les paramètres d'une sphère
 */
export function calculateSphereData(input: SphereInputData): SphereCalculatedData {
  // 1. Obtenir les facteurs de correction selon la température
  const factors = getCorrectionFactors(input.temperature);
  
  // 2. Calculer la densité ambiante
  const densiteAmbiante = input.densiteA15C - factors.facteurLiquide;
  
  // 3. Calculer le poids liquide (tonnes)
  const poidsLiquide = densiteAmbiante * input.volumeLiquide;
  
  // 4. Obtenir la capacité de la sphère
  const capacite = SPHERE_CAPACITIES[input.name];
  
  // 5. Calculer le poids gaz (tonnes)
  const volumeGaz = capacite - input.volumeLiquide;
  const poidsGaz = volumeGaz * factors.facteurGaz * (input.pressionInterne + 1);
  
  // 6. Calculer le poids total
  const poids = poidsLiquide + poidsGaz;
  
  return {
    ...input,
    facteurCorrectionLiquide: factors.facteurLiquide,
    facteurCorrectionGaz: factors.facteurGaz,
    densiteAmbiante,
    poidsLiquide,
    poidsGaz,
    poids
  };
}

/**
 * Calculer le stock final physique total (somme des 3 sphères)
 */
export function calculateStockFinalPhysique(spheres: SphereCalculatedData[]): number {
  return spheres.reduce((total, sphere) => total + sphere.poids, 0);
}

/**
 * Formater les données pour l'affichage
 */
export function formatSphereData(data: SphereCalculatedData) {
  return {
    name: data.name,
    hauteur: `${data.hauteur.toFixed(0)} mm`,
    temperature: `${data.temperature.toFixed(1)}°C`,
    volumeLiquide: `${data.volumeLiquide.toFixed(3)} m³`,
    pression: `${data.pressionInterne.toFixed(1)} bar`,
    densiteA15C: data.densiteA15C.toFixed(4),
    densiteAmbiante: data.densiteAmbiante.toFixed(4),
    poidsLiquide: `${data.poidsLiquide.toFixed(3)} T`,
    poidsGaz: `${data.poidsGaz.toFixed(3)} T`,
    poidsTotal: `${data.poids.toFixed(3)} T`
  };
}

/**
 * Valider les données saisies
 */
export function validateSphereInput(input: SphereInputData): string[] {
  const errors: string[] = [];
  
  if (input.hauteur <= 0) {
    errors.push(`${input.name}: La hauteur doit être positive`);
  }
  
  if (input.temperature < 15 || input.temperature > 36) {
    errors.push(`${input.name}: Température hors limites (15-36°C)`);
  }
  
  if (input.volumeLiquide <= 0) {
    errors.push(`${input.name}: Le volume liquide doit être positif`);
  }
  
  const capacite = SPHERE_CAPACITIES[input.name];
  if (input.volumeLiquide > capacite) {
    errors.push(`${input.name}: Volume liquide (${input.volumeLiquide.toFixed(2)} m³) dépasse la capacité (${capacite.toFixed(2)} m³)`);
  }
  
  if (input.pressionInterne < 0) {
    errors.push(`${input.name}: La pression ne peut pas être négative`);
  }
  
  if (input.densiteA15C <= 0 || input.densiteA15C > 1) {
    errors.push(`${input.name}: Densité à 15°C invalide (doit être entre 0 et 1)`);
  }
  
  return errors;
}
```

---

### ÉTAPE 4 : Seed de la Base de Données

**Fichier :** `prisma/seed-correction-factors.ts` (NOUVEAU)

📄 **Utilise le fichier `seed-correction-factors.ts` que j'ai créé dans `/mnt/user-data/outputs/`**

**Exécuter le seed :**
```bash
npx ts-node prisma/seed-correction-factors.ts
```

**Résultat attendu :**
```
🌱 Seeding correction factors table...
✅ Completed!
   - Created: 109 entries
   - Total: 109 temperatures (15.1°C to 35.3°C)
```

---

### ÉTAPE 5 : Mise à Jour de l'API

**Fichier :** `app/api/production/[id]/complete/route.ts`

Modifier la section des sphères :

```typescript
import { calculateSphereData } from '@/lib/utils/sphereCalculations';
import { z } from 'zod';

// Schema de validation
const sphereInputSchema = z.object({
  name: z.enum(['D100', 'SO2', 'SO3']),
  hauteur: z.number().min(0),
  temperature: z.number().min(15).max(36),
  volumeLiquide: z.number().min(0),
  pressionInterne: z.number().min(0),
  densiteA15C: z.number().min(0).max(1)
});

const completeSchema = z.object({
  butanier: z.number(),
  recuperation: z.number(),
  approSAR: z.number(),
  bottles: z.array(/* ... */),
  ngabou: z.number(),
  exports: z.number(),
  divers: z.number(),
  spheres: z.array(sphereInputSchema).length(3), // Exactement 3 sphères
  observations: z.string().optional()
});

// Dans la transaction
const result = await prisma.$transaction(async (tx) => {
  // ... code existant pour inventory, bottles, etc.

  // Calculer et créer les sphères
  const spheresCalculated = [];
  let stockFinalPhysique = 0;

  for (const sphereInput of data.spheres) {
    // Calculer toutes les valeurs automatiquement
    const calculated = calculateSphereData(sphereInput);
    
    // Créer/Mettre à jour en DB avec toutes les valeurs calculées
    await tx.sphere.upsert({
      where: {
        inventoryId_name: {
          inventoryId,
          name: calculated.name
        }
      },
      create: {
        inventoryId,
        name: calculated.name,
        // Données saisies
        hauteur: calculated.hauteur,
        temperature: calculated.temperature,
        volumeLiquide: calculated.volumeLiquide,
        pressionInterne: calculated.pressionInterne,
        densiteA15C: calculated.densiteA15C,
        // Données calculées
        facteurCorrectionLiquide: calculated.facteurCorrectionLiquide,
        facteurCorrectionGaz: calculated.facteurCorrectionGaz,
        densiteAmbiante: calculated.densiteAmbiante,
        poidsLiquide: calculated.poidsLiquide,
        poidsGaz: calculated.poidsGaz,
        poids: calculated.poids
      },
      update: {
        // Mêmes champs pour update
        hauteur: calculated.hauteur,
        temperature: calculated.temperature,
        volumeLiquide: calculated.volumeLiquide,
        pressionInterne: calculated.pressionInterne,
        densiteA15C: calculated.densiteA15C,
        facteurCorrectionLiquide: calculated.facteurCorrectionLiquide,
        facteurCorrectionGaz: calculated.facteurCorrectionGaz,
        densiteAmbiante: calculated.densiteAmbiante,
        poidsLiquide: calculated.poidsLiquide,
        poidsGaz: calculated.poidsGaz,
        poids: calculated.poids
      }
    });
    
    spheresCalculated.push(calculated);
    stockFinalPhysique += calculated.poids;
  }

  // Calculs finaux avec le stockFinalPhysique CALCULÉ
  const stockFinalTheorique = 
    (inventory.stockInitialPhysique + data.butanier) - 
    (cumulSortie + data.recuperation + data.approSAR);

  const ecart = stockFinalPhysique - stockFinalTheorique;
  const ecartPourcentage = stockFinalTheorique !== 0 
    ? (ecart / stockFinalTheorique) * 100 
    : 0;

  // Mettre à jour l'inventaire avec le stockFinalPhysique
  const updated = await tx.productionInventory.update({
    where: { id: inventoryId },
    data: {
      // ... autres champs
      stockFinalPhysique,  // Calculé depuis les sphères
      stockFinalTheorique,
      ecart,
      ecartPourcentage,
      // ... reste
    },
    include: {
      bottles: true,
      spheres: true,
      arrets: true
    }
  });

  return updated;
});
```

---

### ÉTAPE 6 : Composant de Formulaire

**Fichier :** `app/dashboard/production/components/ProductionForm/SpheresSection.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  calculateSphereData, 
  validateSphereInput,
  SPHERE_CAPACITIES,
  type SphereInputData,
  type SphereCalculatedData 
} from '@/lib/utils/sphereCalculations';

interface SpheresSectionProps {
  spheres: SphereInputData[];
  onChange: (spheres: SphereInputData[]) => void;
}

export function SpheresSection({ spheres, onChange }: SpheresSectionProps) {
  const [calculated, setCalculated] = useState<(SphereCalculatedData | null)[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Recalculer dès qu'une valeur change
  useEffect(() => {
    const newCalculated: (SphereCalculatedData | null)[] = [];
    const newErrors: Record<string, string[]> = {};

    spheres.forEach((sphere, index) => {
      const validationErrors = validateSphereInput(sphere);
      
      if (validationErrors.length > 0) {
        newErrors[sphere.name] = validationErrors;
        newCalculated[index] = null;
      } else {
        try {
          newCalculated[index] = calculateSphereData(sphere);
        } catch (error) {
          console.error('Erreur calcul sphère:', error);
          newErrors[sphere.name] = ['Erreur de calcul'];
          newCalculated[index] = null;
        }
      }
    });

    setCalculated(newCalculated);
    setErrors(newErrors);
  }, [spheres]);

  const updateSphere = (index: number, field: keyof SphereInputData, value: number) => {
    const newSpheres = [...spheres];
    newSpheres[index] = {
      ...newSpheres[index],
      [field]: value
    };
    onChange(newSpheres);
  };

  const totalPoids = calculated
    .filter((c): c is SphereCalculatedData => c !== null)
    .reduce((sum, s) => sum + s.poids, 0);

  const allValid = Object.keys(errors).length === 0 && calculated.every(c => c !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔮 Mesures des Sphères</CardTitle>
        <CardDescription>
          Saisir les 5 paramètres pour chaque sphère. Les poids seront calculés automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {spheres.map((sphere, index) => {
          const calc = calculated[index];
          const sphereErrors = errors[sphere.name] || [];
          const hasError = sphereErrors.length > 0;
          
          return (
            <Card key={sphere.name} className={`border-2 ${hasError ? 'border-red-500' : calc ? 'border-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      Sphère {sphere.name}
                    </CardTitle>
                    {calc && !hasError && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {hasError && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <Badge variant="outline">
                    Capacité: {SPHERE_CAPACITIES[sphere.name].toFixed(3)} m³
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Erreurs */}
                {hasError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {sphereErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Champs de saisie */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Hauteur */}
                  <div className="space-y-2">
                    <Label htmlFor={`${sphere.name}-hauteur`}>
                      Hauteur (mm) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`${sphere.name}-hauteur`}
                      type="number"
                      step="1"
                      value={sphere.hauteur || ''}
                      onChange={(e) => updateSphere(index, 'hauteur', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 7983"
                      className={hasError ? 'border-red-500' : ''}
                    />
                  </div>

                  {/* Température */}
                  <div className="space-y-2">
                    <Label htmlFor={`${sphere.name}-temp`}>
                      Température (°C) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`${sphere.name}-temp`}
                      type="number"
                      step="0.1"
                      value={sphere.temperature || ''}
                      onChange={(e) => updateSphere(index, 'temperature', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 27.1"
                      className={hasError ? 'border-red-500' : ''}
                    />
                  </div>

                  {/* Volume Liquide */}
                  <div className="space-y-2">
                    <Label htmlFor={`${sphere.name}-volume`}>
                      Volume Liquide (m³) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`${sphere.name}-volume`}
                      type="number"
                      step="0.001"
                      value={sphere.volumeLiquide || ''}
                      onChange={(e) => updateSphere(index, 'volumeLiquide', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 1314.539"
                      className={hasError ? 'border-red-500' : ''}
                    />
                  </div>

                  {/* Pression */}
                  <div className="space-y-2">
                    <Label htmlFor={`${sphere.name}-pression`}>
                      Pression (bar) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`${sphere.name}-pression`}
                      type="number"
                      step="0.1"
                      value={sphere.pressionInterne || ''}
                      onChange={(e) => updateSphere(index, 'pressionInterne', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 2.8"
                      className={hasError ? 'border-red-500' : ''}
                    />
                  </div>

                  {/* Densité à 15°C */}
                  <div className="space-y-2">
                    <Label htmlFor={`${sphere.name}-densite`}>
                      Densité à 15°C <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`${sphere.name}-densite`}
                      type="number"
                      step="0.0001"
                      value={sphere.densiteA15C || ''}
                      onChange={(e) => updateSphere(index, 'densiteA15C', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 0.5860"
                      className={hasError ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      Fournie par SAR
                    </p>
                  </div>
                </div>

                {/* Résultats Calculés */}
                {calc && !hasError && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold mb-3 text-green-900 dark:text-green-100">
                      ✅ Calculs Automatiques
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Densité Ambiante</p>
                        <p className="font-mono font-semibold">{calc.densiteAmbiante.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Facteur Liquide</p>
                        <p className="font-mono text-xs">{calc.facteurCorrectionLiquide.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Facteur Gaz</p>
                        <p className="font-mono text-xs">{calc.facteurCorrectionGaz.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Poids Liquide</p>
                        <p className="font-mono font-semibold text-blue-600">
                          {calc.poidsLiquide.toFixed(3)} T
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Poids Gaz</p>
                        <p className="font-mono font-semibold text-green-600">
                          {calc.poidsGaz.toFixed(3)} T
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          Poids Total Sphère
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          {calc.poids.toFixed(3)} T
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Stock Final Physique Total */}
        <Card className={`${allValid ? 'bg-primary/5 border-primary' : 'bg-muted'}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Stock Final Physique Total</p>
                <p className="text-xs text-muted-foreground">(Somme des 3 sphères)</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {totalPoids.toFixed(3)} T
                </p>
                {allValid && (
                  <p className="text-xs text-green-600 flex items-center gap-1 justify-end mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Tous les calculs valides
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Alert>
          <AlertDescription className="text-sm">
            💡 <strong>Source des données :</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li><strong>Hauteur, Température, Volume Liquide</strong> : Application <strong>Entis XL</strong></li>
              <li><strong>Densité à 15°C</strong> : Fournie quotidiennement par <strong>SAR</strong></li>
              <li><strong>Pression</strong> : Mesure manuelle sur site</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Backend & Base de Données (1h)
- [ ] Copier `correctionFactors.ts` dans `lib/data/`
- [ ] Créer `lib/utils/sphereCalculations.ts`
- [ ] Modifier le schéma Prisma (modèles Sphere et CorrectionFactorTable)
- [ ] Exécuter la migration : `npx prisma migrate dev --name enrich_sphere_calculations`
- [ ] Copier `seed-correction-factors.ts` dans `prisma/`
- [ ] Exécuter le seed : `npx ts-node prisma/seed-correction-factors.ts`
- [ ] Vérifier dans Prisma Studio : `npx prisma studio` (109 entrées dans CorrectionFactorTable)

### Phase 2 : API (30min)
- [ ] Mettre à jour `app/api/production/[id]/complete/route.ts`
  - Importer `calculateSphereData`
  - Modifier le schema Zod pour spheres
  - Implémenter les calculs automatiques
  - Sauvegarder toutes les valeurs calculées

### Phase 3 : Frontend (1h30)
- [ ] Créer/Mettre à jour `SpheresSection.tsx`
  - 5 champs de saisie par sphère
  - Calculs en temps réel
  - Validation avec messages d'erreur
  - Affichage des résultats calculés
  - Badge de validation
- [ ] Initialiser les valeurs par défaut dans `ProductionForm/index.tsx`
- [ ] Mettre à jour `AutoCalcs.tsx` si nécessaire

### Phase 4 : Tests (1h)
- [ ] **Test 1 : D100 (APRÈS RÉCEPTION - Excel Feuil1)**
  ```
  Saisir:
  - Hauteur: 7983 mm
  - Température: 27.1°C
  - Volume Liquide: 1314.539 m³
  - Pression: 2.8 bar
  - Densité à 15°C: 0.586
  
  Vérifier:
  - Facteur Liquide: 0.014
  - Facteur Gaz: 0.00233
  - Densité Ambiante: 0.572
  - Poids Liquide: ≈ 751.916 T
  - Poids Total: ≈ 769.535 T
  ```

- [ ] **Test 2 : D100 (AVANT RÉCEPTION - Excel Feuil1)**
  ```
  Saisir:
  - Hauteur: 6467 mm
  - Température: 26.8°C
  - Volume Liquide: 928.357 m³
  - Pression: 2.8 bar
  - Densité à 15°C: 0.586
  
  Vérifier:
  - Poids Total: ≈ 552.292 T
  ```

- [ ] **Test 3 : SO2 (Excel Feuil2)**
- [ ] **Test 4 : SO3 (Excel Feuil3)**
- [ ] **Test 5 : Interpolation (température non exacte comme 26.8°C)**
- [ ] **Test 6 : Validation (valeurs invalides)**
- [ ] **Test 7 : Clôture complète avec 3 sphères**

---

## 📊 VALEURS DE TEST OFFICIELLES

### Test D100 - Feuil1 Excel
```typescript
// APRÈS RÉCEPTION
const testD100After = {
  name: 'D100',
  hauteur: 7983,
  temperature: 27.1,
  volumeLiquide: 1314.539,
  pressionInterne: 2.8,
  densiteA15C: 0.586
};
// Résultat attendu: poids ≈ 769.535 T

// AVANT RÉCEPTION
const testD100Before = {
  name: 'D100',
  hauteur: 6467,
  temperature: 26.8,
  volumeLiquide: 928.357,
  pressionInterne: 2.8,
  densiteA15C: 0.586
};
// Résultat attendu: poids ≈ 552.292 T
```

---

## 📦 FICHIERS À RÉCUPÉRER

Dans `/mnt/user-data/outputs/`, tu as :

1. **correctionFactors.ts** → Copier dans `lib/data/`
2. **seed-correction-factors.ts** → Copier dans `prisma/`
3. **correction_factors_clean.json** → (Référence, pas nécessaire dans le code)

---

## 🎯 RÉSUMÉ DES CHANGEMENTS

**Avant :**
```typescript
// Le chef saisit
{
  name: 'D100',
  hauteur: 7983,
  poids: 769.535  // MANUEL
}
```

**Après :**
```typescript
// Le chef saisit
{
  name: 'D100',
  hauteur: 7983,
  temperature: 27.1,
  volumeLiquide: 1314.539,
  pressionInterne: 2.8,
  densiteA15C: 0.586
}
// Le système calcule automatiquement:
// → poids: 769.535 T ✅
```

**Avantages :**
- ✅ Calculs précis basés sur la vraie table officielle (109 températures)
- ✅ Interpolation automatique pour températures intermédiaires
- ✅ Pas d'erreur de calcul manuel
- ✅ Traçabilité complète de tous les paramètres
- ✅ Validation en temps réel
- ✅ Exactement conforme aux bordereaux Excel

---

## 🚀 DÉMARRER L'IMPLÉMENTATION

```bash
# 1. Créer une branche
git checkout -b feature/sphere-calculations-final

# 2. Copier les fichiers
cp /path/to/outputs/correctionFactors.ts lib/data/
cp /path/to/outputs/seed-correction-factors.ts prisma/

# 3. Créer sphereCalculations.ts
# (copier le code de l'ÉTAPE 3 ci-dessus)

# 4. Modifier le schéma Prisma
# (ÉTAPE 1)

# 5. Migrer
npx prisma migrate dev --name enrich_sphere_calculations
npx prisma generate

# 6. Seeder la table
npx ts-node prisma/seed-correction-factors.ts

# 7. Vérifier
npx prisma studio
# → Vérifier que CorrectionFactorTable a 109 entrées

# 8. Mettre à jour l'API et le frontend
# (ÉTAPES 5 et 6)

# 9. Tester avec les valeurs de l'Excel
npm run dev
```

---

## 🎉 RÉSULTAT FINAL

Après implémentation, le chef de production pourra :

1. ✅ Copier 5 valeurs depuis Entis XL et SAR
2. ✅ Voir les calculs se faire automatiquement en temps réel
3. ✅ Avoir la garantie que les calculs sont corrects (basés sur la table officielle)
4. ✅ Clôturer la journée avec le stock final physique précis
5. ✅ Avoir tous les détails de calcul tracés en base de données

**Temps d'implémentation estimé : 4-5 heures**

**BON COURAGE ! 💪🚀**
