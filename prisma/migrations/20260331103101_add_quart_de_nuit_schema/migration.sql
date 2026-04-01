-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('JOUR', 'NUIT');

-- DropIndex
DROP INDEX "BottleProduction_inventoryId_type_key";

-- DropIndex
DROP INDEX "ProductionInventory_date_productionCenterId_key";

-- AlterTable
ALTER TABLE "BottleProduction" ADD COLUMN     "shift" "ShiftType" NOT NULL DEFAULT 'JOUR';

-- AlterTable
ALTER TABLE "ProductionInventory" ADD COLUMN     "isQuartDeNuit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quartDeNuitCumulSortie" DOUBLE PRECISION,
ADD COLUMN     "quartDeNuitRendement" DOUBLE PRECISION,
ADD COLUMN     "quartDeNuitTA" INTEGER,
ADD COLUMN     "quartDeNuitTHT" INTEGER;

-- CreateTable
CREATE TABLE "ProductionLine" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacityPerHour" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "productionCenterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuartDeNuitLine" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,

    CONSTRAINT "QuartDeNuitLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLine_productionCenterId_name_key" ON "ProductionLine"("productionCenterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "QuartDeNuitLine_inventoryId_lineId_key" ON "QuartDeNuitLine"("inventoryId", "lineId");

-- CreateIndex
CREATE UNIQUE INDEX "BottleProduction_inventoryId_type_shift_key" ON "BottleProduction"("inventoryId", "type", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionInventory_date_productionCenterId_isQuartDeNuit_key" ON "ProductionInventory"("date", "productionCenterId", "isQuartDeNuit");

-- AddForeignKey
ALTER TABLE "ProductionLine" ADD CONSTRAINT "ProductionLine_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuartDeNuitLine" ADD CONSTRAINT "QuartDeNuitLine_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuartDeNuitLine" ADD CONSTRAINT "QuartDeNuitLine_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
