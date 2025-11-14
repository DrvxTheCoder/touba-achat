-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('EN_COURS', 'TERMINE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ArretType" AS ENUM ('INCIDENT_TECHNIQUE', 'PANNE', 'MAINTENANCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "BottleType" AS ENUM ('B2_7', 'B6', 'B9', 'B12_5', 'B38');

-- CreateEnum
CREATE TYPE "SphereType" AS ENUM ('SO2', 'SO3', 'D100');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Access" ADD VALUE 'CREATE_PRODUCTION_INVENTORY';
ALTER TYPE "Access" ADD VALUE 'VIEW_PRODUCTION_DASHBOARD';
ALTER TYPE "Access" ADD VALUE 'VALIDATE_PRODUCTION_INVENTORY';
ALTER TYPE "Access" ADD VALUE 'EXPORT_PRODUCTION_REPORTS';

-- CreateTable
CREATE TABLE "ProductionInventory" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ProductionStatus" NOT NULL DEFAULT 'EN_COURS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedById" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedById" INTEGER,
    "tempsTotal" INTEGER NOT NULL,
    "tempsArret" INTEGER NOT NULL DEFAULT 0,
    "tempsUtile" INTEGER NOT NULL,
    "rendement" DOUBLE PRECISION,
    "stockInitialPhysique" DOUBLE PRECISION NOT NULL,
    "butanier" DOUBLE PRECISION,
    "recuperation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approSAR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulSortie" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockFinalTheorique" DOUBLE PRECISION,
    "stockFinalPhysique" DOUBLE PRECISION,
    "ecart" DOUBLE PRECISION,
    "ecartPourcentage" DOUBLE PRECISION,
    "totalBottlesProduced" INTEGER NOT NULL DEFAULT 0,
    "ngabou" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exports" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "divers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "observations" TEXT,

    CONSTRAINT "ProductionInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionArret" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "type" "ArretType" NOT NULL,
    "heureDebut" TIMESTAMP(3) NOT NULL,
    "heureFin" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL,
    "remarque" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "ProductionArret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleProduction" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "type" "BottleType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "tonnage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BottleProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sphere" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "name" "SphereType" NOT NULL,
    "hauteur" DOUBLE PRECISION NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Sphere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionInventory_date_key" ON "ProductionInventory"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BottleProduction_inventoryId_type_key" ON "BottleProduction"("inventoryId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Sphere_inventoryId_name_key" ON "Sphere"("inventoryId", "name");

-- AddForeignKey
ALTER TABLE "ProductionInventory" ADD CONSTRAINT "ProductionInventory_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionInventory" ADD CONSTRAINT "ProductionInventory_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionArret" ADD CONSTRAINT "ProductionArret_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionArret" ADD CONSTRAINT "ProductionArret_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleProduction" ADD CONSTRAINT "BottleProduction_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sphere" ADD CONSTRAINT "Sphere_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
