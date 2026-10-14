# Module Production GPL — Documentation Complète

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Rôles et accès](#rôles-et-accès)
3. [Tableau de bord](#tableau-de-bord)
4. [Filtres temporels](#filtres-temporels)
5. [Démarrer un inventaire](#démarrer-un-inventaire)
6. [Fiche de production journalière](#fiche-de-production-journalière)
   - [Minuterie et temps de production](#minuterie-et-temps-de-production)
   - [Gestion des arrêts](#gestion-des-arrêts)
   - [Quart de nuit](#quart-de-nuit)
   - [Onglet Approvisionnement](#onglet-approvisionnement)
   - [Onglet Bouteilles](#onglet-bouteilles)
   - [Onglet Sorties](#onglet-sorties)
   - [Onglet Réservoirs](#onglet-réservoirs)
   - [Onglet Mouvements véhicules](#onglet-mouvements-véhicules)
   - [Calculs automatiques](#calculs-automatiques)
   - [Clôture de l'inventaire](#clôture-de-linventaire)
7. [Liste des inventaires](#liste-des-inventaires)
8. [Export et rapports](#export-et-rapports)
9. [Paramètres du module](#paramètres-du-module)
10. [Documents générés](#documents-générés)

---

## Vue d'ensemble

Le module **Production GPL** permet le suivi complet de la production journalière de gaz de pétrole liquéfié (GPL). Il couvre l'ensemble du cycle de vie d'une journée de production : de la saisie du stock initial jusqu'à la clôture avec calcul automatique des écarts, en passant par la traçabilité des approvisionnements, du remplissage de bouteilles, des sorties en vrac et des mouvements de réservoirs.

Il supporte plusieurs **centres de production** indépendants, chacun avec sa propre configuration de réservoirs, ses lignes de production et ses champs dynamiques d'approvisionnement et de sorties.

**Technologies utilisées :** Next.js 14 (App Router), Prisma ORM, React PDF (`@react-pdf/renderer`), XLSX, Recharts.

---

## Rôles et accès

| Rôle | Droits |
|------|--------|
| `ADMIN` / `IT_ADMIN` | Accès complet : création, consultation, modification, suppression, paramètres |
| `CHEF_PRODUCTION` | Peut démarrer et clôturer les inventaires de son centre assigné |
| `DIRECTEUR_GENERAL` / `DOG` / `DIRECTEUR` | Consultation de tous les centres, export des rapports |
| Autres utilisateurs | Lecture seule selon les permissions accordées |

Le contrôle d'accès est appliqué à deux niveaux :
- **Création** (`canCreate`) : autorise le démarrage d'un inventaire et la saisie de données.
- **Consultation** (`canView`) : affiche les métriques, graphiques et listes.

Les chefs de production non-privilégiés voient uniquement les inventaires de leur propre centre.

---

## Tableau de bord

Accessible via `/dashboard/production`, la page principale affiche :

### Métriques clés (KPIs)

Quatre cartes de métriques sont affichées en haut de page et se mettent à jour selon le filtre temporel actif :

| Métrique | Description |
|----------|-------------|
| **Bouteilles Produites** | Nombre total de bouteilles conditionnées sur la période |
| **Cumul Conditionné** | Tonnage total de GPL mis en bouteilles (en tonnes) |
| **Rendement Horaire** | Tonnage moyen produit par heure (T/h) avec % de la capacité installée |
| **Temps Total** | Durée totale de production avec le temps utile (hors arrêts) |

### Section Stock et Réservoirs

Sous les KPIs, trois éléments sont affichés en grille :

- **Écart Total** — Différence entre stock final physique et stock final théorique, avec alerte visuelle si > 5 %.
- **Creux Moyen** — Stock moyen en réservoir exprimé en tonnes et en % de la capacité totale.
- **Cumul Sortie** — Total des sorties ventilé entre bouteilles et vrac (VRAC = Ngabou + Exports + Divers).
- **Jauge de stock physique** — Visualisation graphique du niveau de remplissage actuel des réservoirs (type liquid gauge animé).
- **Carte réservoirs** — État en temps réel de chaque réservoir du centre sélectionné (poids liquide, % capacité).

### Graphiques

- **Évolution du stock** — Graphique en courbe montrant l'évolution du stock physique sur la période filtrée (2/3 de la largeur).
- **Production par type de bouteilles** — Graphique en anneau (donut chart) affichant la répartition du tonnage par type de bouteille avec info-bulle (tonnage, quantité, %).

### Inventaires récents

La liste des 4 derniers inventaires est affichée avec statut (En cours / Terminé / Archivé), centre et responsable. Un lien "Voir tout" renvoie vers la liste complète.

---

## Filtres temporels

La barre de filtres en haut de page permet de piloter l'affichage des métriques et graphiques :

| Filtre | Période |
|--------|---------|
| **Jour** | Dernier inventaire |
| **Semaine** | 7 derniers jours |
| **Mois** | Mois en cours (valeur par défaut) |
| **Trimestre** | 3 derniers mois |
| **Année** | Année en cours |

Un **sélecteur de plage de dates personnalisée** (DatePickerWithRange) permet également de définir une période exacte. Si une plage personnalisée est active, les presets sont désactivés. Un bouton "Réinitialiser" (icône ×) remet les filtres au mois courant.

---

## Sélecteur de centre

Un menu déroulant **CenterSwitcher** en haut à droite permet de filtrer l'ensemble des données (métriques, graphiques, listes) par centre de production. Lorsqu'un centre est sélectionné, une carte d'information apparaît avec :
- Le nom et l'adresse du centre
- Le ou les chefs de production assignés

---

## Démarrer un inventaire

Le formulaire de démarrage est affiché sur la page principale (si l'utilisateur a le droit `canCreate`).

**Prérequis :** Un centre de production doit être sélectionné dans le CenterSwitcher.

**Étapes :**
1. Sélectionner la **date** via le calendrier intégré (défaut : date du jour).
2. Le champ **Stock Initial Physique (tonnes)** est pré-rempli automatiquement avec le stock final physique de l'inventaire de la veille pour le même centre (si disponible). Un indicateur "Chargement..." s'affiche pendant la récupération.
3. Cliquer sur **Démarrer**.

Si un inventaire existe déjà pour cette date et ce centre, l'utilisateur est redirigé directement vers l'inventaire existant (aucun doublon possible).

Un inventaire créé a le statut **EN_COURS** et son identifiant suit le format `INV/JJ/MM/AAAA`.

---

## Fiche de production journalière

Accessible via `/dashboard/production/[id]`, la fiche présente l'ensemble des données saisies et calculées pour une journée.

### Minuterie et temps de production

En haut de la fiche, une carte **Production Timer** affiche :
- Le temps total de production (calculé à partir de `heureDebut` et `heureFin`, avec déduction automatique d'1 heure de pause déjeuner).
- Le temps d'arrêt cumulé (somme des arrêts enregistrés).
- Le **rendement** (temps utile / temps total × 100 %).

### Gestion des arrêts

Pendant qu'un inventaire est **EN_COURS**, un bouton **"Ajouter un arrêt"** est disponible. Le dialogue d'arrêt demande :

| Champ | Description |
|-------|-------------|
| **Type d'arrêt** | Sélection parmi : Problèmes de bascules, Changement de format, Arrêt Sensibilisation, Véhicule manquant, Véhicule en panne, Bouteilles manquantes, Incident technique, Panne équipement, Maintenance préventive/curative, Autre |
| **Durée (minutes)** | Durée cumulée de l'arrêt en minutes |
| **Remarque** | Champ texte libre optionnel |

Tous les arrêts enregistrés sont affichés sous forme de liste avec le type, la durée, la date d'ajout et le nom de l'auteur.

### Quart de nuit

Un interrupteur **Quart de Nuit** permet d'activer la saisie des données d'une équipe de nuit sur la même fiche journalière. Lorsqu'activé, des champs supplémentaires apparaissent :

- **THT (Total Heures Travaillées)** — durée totale travaillée la nuit en minutes.
- **TA (Total Arrêt)** — durée d'arrêt de nuit en minutes.
- **Lignes utilisées** — sélection des lignes de production actives (avec leur capacité horaire en T/h) via des cases à cocher.

Les métriques du quart de nuit sont calculées et affichées en temps réel :
- Cumul sortie QDN (en tonnes)
- Temps utile QDN
- Rendement QDN (T/h) et pourcentage de la capacité

Les bouteilles du quart de nuit sont saisies dans un onglet dédié "Bouteilles Quart de Nuit" (avec `shift = 'NUIT'`), séparé des bouteilles de jour.

### Sauvegarde automatique

Pendant qu'un inventaire est en cours, le formulaire se sauvegarde automatiquement toutes les 30 secondes. Un indicateur en haut du formulaire affiche l'heure de la dernière sauvegarde.

---

## Onglets du formulaire

### Onglet Approvisionnement

Saisie des entrées de GPL pour la journée. Les champs sont **dynamiques** et configurés par centre via les `ApproFieldConfigs`. Exemples de champs typiques :

- **Butanier** — tonnage livré par bateau/camion butanier (T)
- **Récupération** — GPL récupéré en interne (T)
- **Appro SAR** — approvisionnement en provenance de la SAR (T)

Le stock initial (hérité de la veille) est affiché en lecture seule comme référence.

### Onglet Bouteilles

Saisie du nombre de bouteilles remplies par type. L'onglet est dupliqué si le quart de nuit est activé :
- "Bouteilles" → production de jour (`shift = 'JOUR'`)
- "Bouteilles Quart de Nuit" → production de nuit (`shift = 'NUIT'`)

Les types de bouteilles sont configurables (ex. 2,7 kg, 6 kg, 12 kg, 35 kg, etc.). Pour chaque type, la quantité saisie est convertie en **tonnage** calculé automatiquement (quantité × poids unitaire).

### Onglet Sorties

Saisie des sorties de GPL en vrac (hors remplissage bouteilles). Les champs sont dynamiques et configurés par centre via les `SortieFieldConfigs`. Exemples de champs typiques :

- **Ngabou** — livraisons vers Ngabou (T)
- **Exports** — tonnage exporté (T)
- **Divers** — autres sorties diverses (T)

### Onglet Réservoirs

Saisie des mesures de chaque réservoir en fin de journée. Pour chaque réservoir configuré, les champs de saisie manuelle sont :

| Champ | Unité | Description |
|-------|-------|-------------|
| Hauteur | mm | Niveau mesuré dans le réservoir |
| Température liquide | °C | Température du produit liquide |
| Température vapeur | °C | Température de la phase vapeur |
| Volume liquide | m³ | Volume de liquide mesuré |
| Pression interne | bar | Pression dans le réservoir |
| Densité à 15 °C | — | Densité de référence du produit |

Les champs calculés automatiquement (affichés en lecture seule) :

| Champ | Description |
|-------|-------------|
| Facteur de correction liquide | Correction de température pour la phase liquide |
| Facteur de correction vapeur | Correction de température pour la phase vapeur |
| Densité ambiante | Densité calculée à la température ambiante |
| **Poids liquide (T)** | Poids de la phase liquide en tonnes |
| **Poids gaz (T)** | Poids de la phase gazeuse en tonnes |
| **Poids total (T)** | Poids total du contenu du réservoir |

Le **stock final physique** est la somme des `poidsLiquide` de tous les réservoirs.

### Onglet Mouvements véhicules

Suivi du parc de véhicules (camions) par catégorie et type (COM = Commerciaux, LIV = Livraison) :

| Catégorie | COM | LIV |
|-----------|-----|-----|
| Véhicules Déchargés | ✓ | ✓ |
| Véhicules Chargés | ✓ | ✓ |
| Véhicules Non Déchargés | ✓ | ✓ |
| Véhicules Déchargés Non Chargés | ✓ | ✓ |

Un champ de texte libre "Observations / NB" permet d'ajouter des notes. Les données de mouvement sont sauvegardées indépendamment via un bouton dédié.

---

## Calculs automatiques

La section **Calculs automatiques** récapitule en temps réel les données saisies et effectue les calculs de bilan :

### Bilan de masse

```
Stock Final Théorique = Stock Initial
                      - Cumul Sortie QDN (si quart de nuit)
                      + Total Approvisionnements
                      - Total Sorties VRAC
                      - Total Remplissage Bouteilles (JOUR)

Écart = Stock Final Physique - Stock Final Théorique
Écart % = (Écart / Stock Final Théorique) × 100
```

### Indicateurs visuels de l'écart

| Seuil | Couleur | Signification |
|-------|---------|---------------|
| ≤ 2 % | Vert | Excellent |
| 2 % - 5 % | Jaune | Acceptable |
| > 5 % | Rouge | Attention requise |

Si l'écart dépasse 5 % lors de la clôture, une confirmation est demandée à l'utilisateur.

---

## Clôture de l'inventaire

Le bouton **"Clôturer l'inventaire"** en bas du formulaire valide les données et passe l'inventaire au statut **TERMINÉ**.

**Validations avant clôture :**
- Les heures de début et de fin doivent être renseignées.
- Le temps total de production doit être supérieur à zéro.
- Si l'écart dépasse 5 %, une confirmation explicite est requise.

Après clôture, l'inventaire passe en mode lecture seule. Seuls les administrateurs peuvent le modifier ultérieurement.

---

## Mode édition (Administrateurs)

Les inventaires au statut **TERMINÉ** peuvent être modifiés par les administrateurs (`ADMIN`, `IT_ADMIN`) via le bouton crayon (icône orange) ou via `?edit=true` dans l'URL.

En mode édition :
- Une bannière orange "Mode édition activé" est affichée.
- La sauvegarde automatique est désactivée.
- Le bouton de clôture devient "Sauvegarder les modifications".
- Un bouton "Annuler" propose une confirmation avant d'effacer les changements.

### Historique des modifications (Audit Log)

Chaque modification d'un inventaire terminé est tracée dans un journal d'audit. Visible uniquement par les administrateurs, il affiche pour chaque entrée :
- Le nom de l'éditeur et la date/heure de modification.
- Le résumé du nombre de modifications.
- Le détail champ par champ : ancienne valeur (rouge barré) → nouvelle valeur (vert).

### Suppression

Les administrateurs peuvent supprimer définitivement un inventaire via le bouton poubelle (rouge). Une boîte de dialogue de confirmation précise la date et le centre concernés. La suppression est **irréversible** et entraîne la suppression en cascade de toutes les données associées (bouteilles, réservoirs, arrêts, mouvements véhicules).

---

## Liste des inventaires

Accessible via `/dashboard/production/liste-inventaires`, cette page présente la liste complète de tous les inventaires avec :

### Tableau des inventaires

| Colonne | Description |
|---------|-------------|
| Inventaire | Identifiant `INV/JJ/MM/AAAA` + badge de statut |
| Centre / Responsable | Nom du centre de production + nom du créateur |
| Stock (T) | Stock final physique en tonnes |
| Actions | Boutons Voir, Modifier (admin), Supprimer (admin) |

La liste est paginée (15 éléments par page) avec navigation complète.

### Filtres de la liste

- **Recherche** — champ texte avec debounce (300 ms) pour filtrer par date ou nom.
- **Onglets par centre** — filtrage par centre de production (les utilisateurs non-privilégiés voient uniquement leur centre).

### Export mensuel

En haut de la page, une carte d'export permet de générer des rapports mensuels :

1. **Sélectionner le mois** (janvier à décembre)
2. **Sélectionner l'année** (année courante et 5 années antérieures)
3. **Sélectionner le centre de production**
4. Choisir l'action :
   - **Télécharger PDF** — génère et télécharge le rapport mensuel en PDF.
   - **Imprimer** — génère le PDF et l'ouvre dans un nouvel onglet prêt à l'impression.

> Les chefs de production non-privilégiés ne peuvent exporter que les données de leur propre centre.

---

## Export et rapports

### Rapport journalier PDF (Fiche d'inventaire)

Accessible via le menu d'export de chaque inventaire individuel (`/api/production/[id]/export?format=pdf`).

**Contenu du document :**

1. **En-tête** — Logo TOUBA-Gaz, titre "FICHE D'INVENTAIRE PRODUCTION (JOURNALIER)", date et centre.
2. **Stock départ** — Tableau des réservoirs de la veille avec hauteur, poids liquide, poids gaz, poids total et total général.
3. **Approvisionnements & Sorties** — Récapitulatif fusionné :
   - Détail des approvisionnements (Butanier, Récupération, Appro SAR) avec total.
   - Détail des sorties par type de bouteille (quantité + tonnage) avec sous-total remplissage.
   - Autres sorties (Ngabou, Exports, Divers).
   - **Cumul sortie** total.
4. **Stock final physique (Réservoirs)** — Tableau des réservoirs avec les mêmes colonnes + total poids liquide.
5. **Disposition en deux colonnes** :
   - **Temps de production** — temps total, temps d'arrêt, temps utile, rendement %.
   - **Stock final** — stock théorique, stock physique, écart (T) et écart (%).
6. **Observations** — si renseignées.
7. **Pied de page** — date/heure de génération.

### Rapport mensuel PDF

Le **Rapport Mensuel de Production GPL** est le document principal de suivi de la production. Il est généré par le template `DynamicMonthlyProductionPDF` (ou `MonthlyProductionPDF` pour les centres sans configuration dynamique).

**Contenu du rapport mensuel :**

Voir la capture d'écran ci-dessous.

Le rapport contient un tableau récapitulatif mensuel avec une **ligne par journée de production** et les colonnes suivantes :

| Colonne | Description |
|---------|-------------|
| Date | Date de la journée |
| Stock Départ | Stock initial physique (T) |
| Appro | Colonnes dynamiques des approvisionnements (Butanier, Récupération, etc.) |
| Sorties | Colonnes dynamiques des sorties vrac + remplissage par type de bouteille |
| Cumul Sortie | Total sorties de la journée (T) |
| Stock Final Physique | Mesure physique des réservoirs (T) |
| Stock Théorique | Calculé (T) |
| Écart | Différence SFP - ST (T) |
| Écart % | Écart en pourcentage |
| THT | Temps total de production (heures) |
| TA | Temps d'arrêt (heures) |
| TU | Temps utile (heures) |
| Rendement % | TU / THT × 100 |
| Rendement H | Rendement horaire (T/h) |
| % Capacité | Rendement horaire / capacité installée × 100 |

Une **ligne TOTAUX/MOYENNES** est calculée en pied de tableau.

#### Capture d'écran du rapport mensuel

![Rapport Mensuel de Production GPL](../Capture%20Rapport%20Production.png)

*Le rapport mensuel PDF présente l'ensemble des journées de production avec tous les indicateurs clés dans un tableau compact format A4 paysage.*

### Export Excel

L'export Excel (`format=excel`) génère un fichier `.xlsx` avec trois feuilles :

1. **Résumé** — une ligne par inventaire : date, stocks, cumul sortie, écart, rendement, bouteilles, arrêts.
2. **Production Bouteilles** — détail par type de bouteille pour chaque journée.
3. **Arrêts Techniques** — liste de tous les arrêts avec type, durée, remarque et auteur.

**Permission requise :** `EXPORT_PRODUCTION_REPORTS`

---

## Paramètres du module

Accessible via `/dashboard/production/settings` (ADMIN uniquement, bouton roue dentée en haut de la page principale).

### 1. Types de bouteilles

Gestion des types de bouteilles GPL et leurs poids unitaires (kg). Chaque type de bouteille est utilisé pour calculer automatiquement le tonnage lors de la saisie des quantités.

Exemples : 2,7 kg, 6 kg, 12 kg, 35 kg, ...

### 2. Centres de production

Configuration des centres de production (`/dashboard/production/settings/centers`). Chaque centre dispose de :

| Paramètre | Description |
|-----------|-------------|
| **Nom** | Identifiant unique du centre |
| **Adresse** | Localisation du centre |
| **Chefs de production** | Liste des utilisateurs responsables (relation many-to-many) |
| **Nombre de lignes** | Nombre de lignes de production |
| **Capacité par ligne** | Capacité horaire par ligne (T/h) |
| **Capacité totale** | Capacité horaire totale (T/h) |
| **Lignes de production** | Configuration individuelle de chaque ligne avec nom et capacité |
| **Champs Approvisionnement** | Champs dynamiques configurables pour la section appro |
| **Champs Sorties** | Champs dynamiques configurables pour la section sorties |

### 3. Réservoirs GPL

Gestion de la configuration des réservoirs (`/dashboard/production/settings/reservoirs`). Chaque réservoir est associé à un centre de production et dispose de :

| Paramètre | Description |
|-----------|-------------|
| **Nom** | Identifiant du réservoir (ex. D100, SO2, SO3) |
| **Type** | SPHERE, CIGARE, AUTRE |
| **Capacité** | Capacité en m³ |
| **Capacité (tonnes)** | Capacité maximale en tonnes |
| **Mode de calcul** | AUTOMATIC (calcul par formule physique) ou PERCENTAGE_BASED (basé sur le % de remplissage) |

---

## Modèle de données

### Schéma simplifié

```
ProductionInventory
├── ProductionCenter (centre)
├── User (startedBy, completedBy)
├── ProductionArret[] (arrêts)
├── BottleProduction[] (bouteilles, avec shift JOUR/NUIT)
├── Reservoir[] (mesures réservoirs)
├── ApproValue[] (valeurs dynamiques d'approvisionnement)
├── SortieValue[] (valeurs dynamiques de sorties)
├── VehicleMovement (mouvements véhicules)
├── QuartDeNuitLine[] (lignes du quart de nuit)
└── InventoryAuditLog[] (historique modifications)
```

### Statuts d'un inventaire

| Statut | Description |
|--------|-------------|
| `EN_COURS` | Inventaire en cours de saisie |
| `TERMINE` | Inventaire clôturé |
| `ARCHIVE` | Inventaire archivé (statut historique) |

### Types d'arrêt

- `BASCULES` — Problèmes de bascules
- `CHANGEMENT_FORMAT` — Changement de format de bouteilles
- `SENSIBILISATION` — Arrêt Sensibilisation
- `VEHICULE_MANQUANT` — Véhicule manquant
- `VEHICULE_EN_PANNE` — Véhicule en panne
- `BOUTEILLES_MANQUANTES` — Bouteilles manquantes
- `INCIDENT_TECHNIQUE` — Incident technique
- `PANNE` — Panne équipement
- `MAINTENANCE` — Maintenance préventive/curative
- `AUTRE` — Autre raison

---

## Formules de calcul

### Temps de production

```
Temps Total = (Heure Fin - Heure Début) - 60 minutes (pause déjeuner)
Temps Utile = Temps Total - Temps Arrêt
Rendement = (Temps Utile / Temps Total) × 100 %
```

> Si l'heure de fin est le lendemain (ex. 23h00 → 02h00), 24 heures sont automatiquement ajoutées.

### Bilan de stock

```
Stock Final Théorique =
    Stock Initial Physique
  - Cumul Sortie QDN (si quart de nuit actif)
  + Σ ApproValues (Butanier + Récupération + Appro SAR + ...)
  - Σ SortieValues (Ngabou + Exports + Divers + ...)
  - Remplissage Bouteilles JOUR (en tonnes)

Stock Final Physique = Σ poidsLiquide de tous les réservoirs

Écart = Stock Final Physique - Stock Final Théorique
Écart % = (Écart / Stock Final Théorique) × 100
```

### Rendement horaire

```
Rendement Horaire = Cumul Sortie Total / Temps Utile (en heures)
% Capacité = (Rendement Horaire / Capacité Installée Totale) × 100
```

---

## Rafraîchissement automatique

- La liste des inventaires sur la page principale se rafraîchit toutes les **5 secondes**.
- La fiche d'un inventaire EN_COURS se rafraîchit toutes les **30 secondes**.
- La sauvegarde automatique du formulaire s'exécute toutes les **30 secondes** de modification.
