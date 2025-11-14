-- CreateEnum
CREATE TYPE "ReservoirType" AS ENUM ('SPHERE', 'CIGARE', 'AUTRE');

-- CreateTable
CREATE TABLE "ProductionCenter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chefProductionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservoirConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReservoirType" NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "productionCenterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservoirConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleTypeConfig" (
    "id" SERIAL NOT NULL,
    "type" "BottleType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BottleTypeConfig_pkey" PRIMARY KEY ("id")
);

-- AlterTable ProductionInventory: add productionCenterId (nullable)
ALTER TABLE "ProductionInventory" ADD COLUMN "productionCenterId" INTEGER;

-- Rename Sphere table to Reservoir
ALTER TABLE "Sphere" RENAME TO "Reservoir";

-- AlterTable Reservoir: add reservoirConfigId (nullable)
ALTER TABLE "Reservoir" ADD COLUMN "reservoirConfigId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCenter_name_key" ON "ProductionCenter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ReservoirConfig_name_productionCenterId_key" ON "ReservoirConfig"("name", "productionCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "BottleTypeConfig_type_key" ON "BottleTypeConfig"("type");

-- AddForeignKey
ALTER TABLE "ProductionCenter" ADD CONSTRAINT "ProductionCenter_chefProductionId_fkey" FOREIGN KEY ("chefProductionId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservoirConfig" ADD CONSTRAINT "ReservoirConfig_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionInventory" ADD CONSTRAINT "ProductionInventory_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservoir" ADD CONSTRAINT "Reservoir_reservoirConfigId_fkey" FOREIGN KEY ("reservoirConfigId") REFERENCES "ReservoirConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
