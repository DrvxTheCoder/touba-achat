-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ArretType" ADD VALUE 'BASCULES';
ALTER TYPE "ArretType" ADD VALUE 'CHANGEMENT_FORMAT';
ALTER TYPE "ArretType" ADD VALUE 'SENSIBILISATION';
ALTER TYPE "ArretType" ADD VALUE 'VEHICULE_MANQUANT';
ALTER TYPE "ArretType" ADD VALUE 'VEHICULE_EN_PANNE';
ALTER TYPE "ArretType" ADD VALUE 'BOUTEILLES_MANQUANTES';
