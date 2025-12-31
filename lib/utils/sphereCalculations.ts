// lib/utils/sphereCalculations.ts
// Calculs des poids de GPL pour les sphères basés sur les formules Excel officielles

import { getCorrectionFactors } from '@/lib/data/correctionFactors';

export interface SphereInputData {
  name: string;
  hauteur: number; // en mm
  temperature: number; // en °C (température liquide)
  temperatureVapeur: number; // en °C (température vapeur)
  volumeLiquide: number; // en m³
  pressionInterne: number; // en bar
  densiteA15C: number; // densité à 15°C (généralement 0.508)
}

export interface SphereCalculatedData extends SphereInputData {
  // Facteurs de correction (depuis table)
  facteurCorrectionLiquide: number;
  facteurCorrectionVapeur: number;

  // Densité ambiante calculée
  densiteAmbiante: number;

  // Poids calculés en tonnes
  poidsLiquide: number;
  poidsGaz: number;
  poidsTotal: number;
}

/**
 * Capacités volumiques des sphères en m³
 * Source: Fichier Excel officiel
 */
export const SPHERE_CAPACITIES: Record<string, number> = {
  D100: 3304.491,
  SO2: 3297.610,
  SO3: 3324.468,
};

/**
 * Calcule le volume de liquide dans une sphère à partir de la hauteur mesurée
 * @param sphereName Nom de la sphère (D100, SO2, SO3)
 * @param liquidHeightMm Hauteur du liquide mesurée en millimètres
 * @returns Volume du liquide en m³
 */
export function calculateLiquidVolumeFromHeight(
  sphereName: string,
  liquidHeightMm: number
): number {
  // Récupérer le volume total de la sphère
  const totalVolume = SPHERE_CAPACITIES[sphereName];
  if (!totalVolume) {
    throw new Error(`Capacité inconnue pour la sphère ${sphereName}`);
  }

  // Convertir la hauteur de mm en m
  const liquidHeightM = liquidHeightMm / 1000;

  // Calculer le rayon de la sphère à partir du volume total
  // V = (4/3) * π * R³ => R = ∛((3 * V) / (4 * π))
  const radius = Math.cbrt((3 * totalVolume) / (4 * Math.PI));

  // Calculer le volume du segment sphérique (calotte sphérique)
  // V = (π * h²) * (3R - h) / 3
  const h = liquidHeightM;
  const volume = (Math.PI * h * h * (3 * radius - h)) / 3;

  return volume;
}

/**
 * Calcule toutes les valeurs dérivées pour une sphère
 * Formules basées sur le fichier Excel officiel
 */
export function calculateSphereData(input: SphereInputData): SphereCalculatedData {
  // 1. Récupérer les facteurs de correction depuis la table
  // Facteur liquide basé sur température liquide
  const { facteurLiquide } = getCorrectionFactors(input.temperature);
  // Facteur gaz basé sur température vapeur
  const { facteurGaz } = getCorrectionFactors(input.temperatureVapeur);

  // 2. Calculer la densité ambiante
  // Formule Excel: Densité à 15°C - Facteur de correction densité liquide
  const densiteAmbiante = input.densiteA15C - facteurLiquide;

  // 3. Calculer le poids du liquide (en tonnes)
  // Formule Excel: Densité Ambiente × Volume Liquide
  const poidsLiquide = densiteAmbiante * input.volumeLiquide;

  // 4. Calculer le volume de gaz (capacité totale - volume liquide)
  const sphereCapacity = SPHERE_CAPACITIES[input.name];
  if (!sphereCapacity) {
    throw new Error(`Capacité inconnue pour la sphère ${input.name}`);
  }
  const volumeGaz = sphereCapacity - input.volumeLiquide;

  // 5. Calculer le poids du gaz (en tonnes)
  // Formule Excel: (Capacité - Volume liquide) × Facteur correction gaz × (Pression + 1)
  const poidsGaz = volumeGaz * facteurGaz * (input.pressionInterne + 1);

  // 6. Calculer le poids total
  const poidsTotal = poidsLiquide + poidsGaz;

  return {
    ...input,
    facteurCorrectionLiquide: facteurLiquide,
    facteurCorrectionVapeur: facteurGaz,
    densiteAmbiante,
    poidsLiquide,
    poidsGaz,
    poidsTotal,
  };
}

/**
 * Valide les données d'entrée d'une sphère
 * Retourne un tableau d'erreurs (vide si tout est valide)
 */
export function validateSphereInput(input: SphereInputData): string[] {
  const errors: string[] = [];

  // Validation de la hauteur
  if (input.hauteur < 0) {
    errors.push('La hauteur ne peut pas être négative');
  }
  if (input.hauteur > 30000) {
    errors.push('La hauteur semble anormalement élevée (> 30000 mm)');
  }

  // Validation de la température liquide
  if (input.temperature < 15.0 || input.temperature > 36.0) {
    errors.push('La température liquide doit être entre 15.0°C et 37.0°C');
  }

  // Validation de la température vapeur
  if (input.temperatureVapeur < 15.0 || input.temperatureVapeur > 36.0) {
    errors.push('La température vapeur doit être entre 15.0°C et 37.0°C');
  }

  // Validation du volume liquide
  const sphereCapacity = SPHERE_CAPACITIES[input.name];
  if (!sphereCapacity) {
    errors.push(`Nom de sphère invalide: ${input.name}. Utilisez D100, SO2 ou SO3`);
  } else {
    if (input.volumeLiquide < 0) {
      errors.push('Le volume liquide ne peut pas être négatif');
    }
    if (input.volumeLiquide > sphereCapacity) {
      errors.push(
        `Le volume liquide (${input.volumeLiquide} m³) dépasse la capacité de la sphère (${sphereCapacity} m³)`
      );
    }
  }

  // Validation de la pression interne
  if (input.pressionInterne < 0) {
    errors.push('La pression interne ne peut pas être négative');
  }
  if (input.pressionInterne > 20) {
    errors.push('La pression interne semble anormalement élevée (> 20 bar)');
  }

  // // Validation de la densité à 15°C
  // if (input.densiteA15C < 0.4 || input.densiteA15C > 0.6) {
  //   errors.push('La densité à 15°C doit être entre 0.4 et 0.6 (valeur typique: 0.508)');
  // }

  return errors;
}

/**
 * Calcule le stock final physique total (somme des poids de toutes les sphères)
 */
export function calculateStockFinalPhysique(spheres: SphereCalculatedData[]): number {
  return spheres.reduce((sum, sphere) => sum + sphere.poidsTotal, 0);
}
