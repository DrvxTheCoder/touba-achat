-- AlterTable
-- Add new columns with default values first
ALTER TABLE "Sphere" ADD COLUMN "temperature" DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE "Sphere" ADD COLUMN "volumeLiquide" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sphere" ADD COLUMN "pressionInterne" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sphere" ADD COLUMN "densiteA15C" DOUBLE PRECISION NOT NULL DEFAULT 0.508;
ALTER TABLE "Sphere" ADD COLUMN "facteurCorrectionLiquide" DOUBLE PRECISION;
ALTER TABLE "Sphere" ADD COLUMN "facteurCorrectionVapeur" DOUBLE PRECISION;
ALTER TABLE "Sphere" ADD COLUMN "densiteAmbiante" DOUBLE PRECISION;
ALTER TABLE "Sphere" ADD COLUMN "poidsLiquide" DOUBLE PRECISION;
ALTER TABLE "Sphere" ADD COLUMN "poidsGaz" DOUBLE PRECISION;
ALTER TABLE "Sphere" ADD COLUMN "poidsTotal" DOUBLE PRECISION;

-- Rename old 'poids' column to preserve data temporarily
ALTER TABLE "Sphere" RENAME COLUMN "poids" TO "poids_old";

-- Copy poidsTotal from old poids (for backward compatibility)
UPDATE "Sphere" SET "poidsTotal" = "poids_old" WHERE "poids_old" IS NOT NULL;

-- Drop the old column after data is copied
ALTER TABLE "Sphere" DROP COLUMN "poids_old";

-- CreateTable
CREATE TABLE "CorrectionFactorTable" (
    "id" SERIAL NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "facteurLiquide" DOUBLE PRECISION NOT NULL,
    "facteurVapeur" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CorrectionFactorTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorrectionFactorTable_temperature_key" ON "CorrectionFactorTable"("temperature");
