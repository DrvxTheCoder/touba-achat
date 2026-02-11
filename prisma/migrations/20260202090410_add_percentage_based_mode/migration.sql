-- AlterEnum
ALTER TYPE "CalculationMode" ADD VALUE 'PERCENTAGE_BASED';

-- AlterTable
ALTER TABLE "ProductionInventory" ADD COLUMN     "densiteAmbiante" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Reservoir" ADD COLUMN     "tankPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
