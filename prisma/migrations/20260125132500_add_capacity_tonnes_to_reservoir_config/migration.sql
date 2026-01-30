-- DropIndex
DROP INDEX "ProductionInventory_date_key";

-- AlterTable
ALTER TABLE "ReservoirConfig" ADD COLUMN     "capacityTonnes" DOUBLE PRECISION;
