# TOUBA OIL S.A.U - Documentation Complète du Projet

**Projet de Dématérialisation des États de Besoins et des Ordres de Mission**

## Table des matières

1. [Introduction](#introduction)
2. [Stack Technique](#stack-technique)
3. [Architecture du Projet](#architecture-du-projet)
4. [Modèle de Données](#modèle-de-données)
5. [Fonctionnalités Principales](#fonctionnalités-principales)
6. [Guide d'Utilisation](#guide-dutilisation)
7. [Déploiement](#déploiement)
8. [Maintenance et Support](#maintenance-et-support)

## Introduction

Ce projet a été développé pour TOUBA OIL S.A.U afin de dématérialiser et optimiser la gestion des états de besoins (EDB) et des ordres de mission (ODM). L'application vise à rationaliser les processus internes, améliorer la traçabilité des demandes, et faciliter la communication entre les différents départements de l'entreprise.

### Objectifs du Projet

- Digitaliser les processus d'approbation des états de besoins
- Automatiser le suivi des demandes et des validations
- Améliorer l'efficacité organisationnelle
- Réduire les délais de traitement
- Établir un historique complet des transactions
- Faciliter le reporting et l'analyse des données

## Stack Technique

L'application est construite avec les technologies modernes suivantes:

### Frontend
- **Next.js 14** (App Router) - Framework React pour le rendu côté serveur et le routage
- **TypeScript** - Pour la sécurité des types et la robustesse du code
- **TailwindCSS** - Pour le styling et la conception responsive
- **Shadcn/UI** - Composants d'interface utilisateur accessibles et réutilisables
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation des données
- **lucide-react** - Icônes modernes

### Backend
- **Next.js API Routes** - API serverless intégrée à l'application
- **Prisma ORM** - ORM pour l'interaction avec la base de données
- **NextAuth.js** - Authentification et gestion des sessions
- **PostgreSQL** - Base de données relationnelle

### Outils de Développement
- **pnpm** - Gestionnaire de paquets
- **ESLint** - Linting du code
- **Prettier** - Formatage du code

## Architecture du Projet

L'application suit une architecture moderne basée sur les composants et les services:

### Structure des Dossiers

```
📦app                       # Dossier principal (Next.js App Router)
 ┣ 📂api                    # API Routes Next.js
 ┣ 📂auth                   # Composants d'authentification
 ┣ 📂dashboard              # Interface du tableau de bord
 ┃ ┣ 📂commandes            # Gestion des commandes
 ┃ ┣ 📂components           # Composants spécifiques au dashboard
 ┃ ┣ 📂employes             # Gestion des employés
 ┃ ┣ 📂etats                # Gestion des états de besoins
 ┃ ┣ 📂parametres           # Paramètres de l'application
 ┣ 📂hooks                  # Hooks React personnalisés
📦components                # Composants réutilisables
 ┣ 📂forms                  # Composants de formulaires
 ┣ 📂logos                  # Logos et assets
 ┣ 📂ui                     # Composants UI génériques (shadcn)
📦lib                       # Fonctions utilitaires
📦prisma                    # Schéma Prisma et migrations
```

### Flux de Données

1. **Couche Présentation** - Composants React et UI
2. **Couche Logique** - Hooks, contextes et gestionnaires d'état
3. **Couche API** - API Routes pour communiquer avec la base de données
4. **Couche Données** - Prisma ORM et PostgreSQL

## Modèle de Données

Le modèle de données est structuré autour des entités principales suivantes:

### Entités Principales

#### Utilisateurs et Employés
- **User** - Informations d'authentification et rôles
- **Employee** - Informations détaillées sur les employés
- **Department** - Structure départementale

#### États de Besoins
- **EtatDeBesoin** - Demandes d'achat
- **Category** - Catégorisation des demandes
- **Attachment** - Documents joints aux demandes
- **Order** - Commandes liées aux états de besoins
- **FinalSupplier** - Fournisseurs sélectionnés

#### Ordres de Mission
- **OrdreDeMission** - Demandes de déplacement professionnel

#### Suivi et Notifications
- **Notification** - Alertes et messages
- **EtatDeBesoinAuditLog** - Journal d'audit des modifications

### Statuts et Workflow

#### États de Besoins (EDB)
- `DRAFT` - Brouillon en cours d'édition
- `SUBMITTED` - Soumis pour approbation
- `APPROVED_RESPONSABLE` - Approuvé par le responsable direct
- `APPROVED_DIRECTEUR` - Approuvé par le directeur du département
- `AWAITING_MAGASINIER` - En attente de traitement par le magasinier
- `MAGASINIER_ATTACHED` - Documents attachés par le magasinier
- `AWAITING_SUPPLIER_CHOICE` - En attente du choix du fournisseur
- `SUPPLIER_CHOSEN` - Fournisseur sélectionné
- `AWAITING_IT_APPROVAL` - En attente d'approbation IT (si nécessaire)
- `IT_APPROVED` - Approuvé par le service IT
- `AWAITING_FINAL_APPROVAL` - En attente d'approbation finale
- `APPROVED_DG` - Approuvé par le Directeur Général
- `REJECTED` - Rejeté
- `COMPLETED` - Finalisé

#### Ordres de Mission (ODM)
- `DRAFT` - Brouillon en cours d'édition
- `SUBMITTED` - Soumis pour approbation
- `APPROVED_DIRECTEUR` - Approuvé par le directeur du département
- `APPROVED_RH` - Approuvé par les Ressources Humaines
- `REJECTED` - Rejeté
- `COMPLETED` - Finalisé

### Rôles et Permissions

- **USER** - Utilisateur standard
- **RESPONSABLE** - Responsable d'équipe
- **DIRECTEUR** - Directeur de département
- **DIRECTEUR_GENERAL** - Directeur Général
- **MAGASINIER** - Gestionnaire de stock
- **RH** - Ressources Humaines
- **AUDIT** - Auditeur
- **IT_ADMIN** - Administrateur IT
- **ADMIN** - Administrateur système

## Fonctionnalités Principales

### Module États de Besoins (EDB)

#### Création et Soumission
- Création de nouvelles demandes d'achat
- Spécification des détails (titre, description, catégorie)
- Soumission pour approbation

#### Circuit de Validation
1. **Approbation Responsable** - Premier niveau de validation
2. **Approbation Directeur** - Second niveau de validation
3. **Traitement Magasinier** - Attachement des devis et factures
4. **Choix du Fournisseur** - Sélection du fournisseur final
5. **Approbation IT** (conditionnelle) - Pour les demandes liées à l'informatique
6. **Approbation Finale** - Validation finale

#### Suivi et Gestion
- Tableau de bord de suivi des demandes
- Visualisation de l'état d'avancement
- Historique des modifications
- Notifications des changements d'état

### Module Ordres de Mission (ODM)

#### Création et Validation
- Création de demandes de déplacement
- Circuit de validation (Directeur → RH)
- Suivi des approbations

#### Gestion et Reporting
- Vue d'ensemble des missions
- Tableaux de bord analytiques
- Exportation des données

### Administration

- Gestion des utilisateurs et des droits
- Configuration des départements
- Paramétrage des catégories
- Suivi des activités (logs d'audit)

## Guide d'Utilisation

### Connexion et Authentification

1. Accédez à l'application via l'URL fournie
2. Entrez vos identifiants (email et mot de passe)
3. Vous serez redirigé vers le tableau de bord correspondant à votre rôle

### Navigation dans l'Interface

L'interface principale est divisée en plusieurs sections:

- **Tableau de bord** - Vue d'ensemble et statistiques
- **États de Besoins** - Gestion des demandes d'achat
- **Ordres de Mission** - Gestion des déplacements
- **Employés** - Gestion du personnel
- **Paramètres** - Configuration du système

### Gestion des États de Besoins

#### Pour les Utilisateurs Standards

**Création d'un État de Besoin:**
1. Accédez à la section "États de Besoins"
2. Cliquez sur "Nouveau"
3. Remplissez les champs requis (titre, description, catégorie)
4. Ajoutez des pièces jointes si nécessaire
5. Enregistrez comme brouillon ou soumettez directement

**Suivi des Demandes:**
1. Consultez la liste de vos demandes
2. Utilisez le bouton "Traquer" pour voir l'avancement
3. Recevez des notifications à chaque changement d'état

#### Pour les Approbateurs

**Approbation des Demandes:**
1. Accédez à la section "États de Besoins" ou "À Approuver"
2. Consultez les demandes en attente
3. Examinez les détails de chaque demande
4. Approuvez ou rejetez (avec justification)

**Escalade au Niveau Supérieur:**
1. Pour les directeurs, possibilité d'escalader au DG
2. Utilisez le bouton "Escalader au DG" sur la page de détails

#### Pour les Magasiniers

**Traitement des Demandes Approuvées:**
1. Accédez aux demandes en attente de traitement
2. Ajoutez les devis des fournisseurs
3. Spécifiez les montants et détails
4. Marquez comme "Traité"

### Gestion des Ordres de Mission

#### Création d'un Ordre de Mission

1. Accédez à la section "Ordres de Mission"
2. Cliquez sur "Nouveau"
3. Spécifiez les détails du déplacement
4. Soumettez pour approbation

#### Approbation des Ordres de Mission

1. Directeurs: Approuvez les demandes de votre département
2. RH: Validation finale après approbation du directeur

### Administration Système

#### Gestion des Utilisateurs

1. Accédez à "Paramètres" > "Utilisateurs"
2. Créez, modifiez ou désactivez des comptes
3. Assignez des rôles et des permissions

#### Configuration des Départements

1. Accédez à "Paramètres" > "Départements"
2. Gérez la structure organisationnelle
3. Associez les employés aux départements

## Déploiement

L'application est déployée sur un VPS (Virtual Private Server) en utilisant Coolify sur Hostinger.

### Prérequis

- Un VPS chez Hostinger avec Ubuntu 22.04 ou supérieur
- Au moins 2GB de RAM et 1 vCPU
- Un nom de domaine configuré avec les enregistrements DNS appropriés

### Installation de Coolify

1. Connectez-vous à votre VPS via SSH:
   ```
   ssh root@your_server_ip
   ```

2. Installez Docker (si non installé):
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. Installez Coolify:
   ```bash
   curl -fsSL https://get.coollabs.io/coolify/install.sh | bash
   ```

4. Suivez les instructions à l'écran pour configurer Coolify

### Configuration du Projet dans Coolify

1. Accédez à l'interface Coolify (https://votre-domaine-coolify:3000)
2. Créez un nouveau projet
3. Connectez votre dépôt Git (GitHub, GitLab, etc.)
4. Configurez les variables d'environnement:
   - `DATABASE_URL` - URL de connexion PostgreSQL
   - `DIRECT_URL` - URL directe pour Prisma
   - `NEXTAUTH_SECRET` - Clé secrète pour NextAuth
   - `NEXTAUTH_URL` - URL de l'application
   - Autres variables spécifiques à l'application

### Base de Données

1. Créez une base de données PostgreSQL dans Coolify
2. Configurez les informations de connexion
3. Exécutez les migrations Prisma:
   ```
   npx prisma migrate deploy
   ```

### Configuration du Domaine et HTTPS

1. Dans Coolify, associez votre domaine au déploiement
2. Activez HTTPS avec Let's Encrypt
3. Configurez les redirections (HTTP vers HTTPS)

### Déploiement Continu

1. Configurez le déploiement automatique à partir de votre branche principale
2. Définissez la commande de build:
   ```
   pnpm install && pnpm build
   ```
3. Configurez les hooks post-déploiement si nécessaire

## Maintenance et Support

### Mises à Jour

Pour mettre à jour l'application:

1. Poussez les modifications sur la branche principale
2. Coolify déploiera automatiquement les changements
3. Vérifiez les logs pour vous assurer que le déploiement s'est bien déroulé

### Sauvegarde

1. **Base de données**:
   - Configurez des sauvegardes automatiques dans Coolify
   - Programmez des exports réguliers via `pg_dump`

2. **Fichiers**:
   - Sauvegardez régulièrement les fichiers uploadés
   - Utilisez un service de stockage externe pour les pièces jointes importantes

### Monitoring

1. Utilisez les outils de monitoring intégrés à Coolify
2. Configurez des alertes en cas de panne ou de surcharge
3. Surveillez l'utilisation des ressources (CPU, mémoire, disque)

### Support Technique

Pour toute assistance technique:

- Consultez la documentation interne
- Contactez l'équipe de développement via [email/contact]
- Ouvrez un ticket dans le système de suivi des problèmes

---

*Document préparé pour TOUBA OIL S.A.U - Service Informatique*  
*Date: 28 Avril 2025*  
*Version: 1.0*
