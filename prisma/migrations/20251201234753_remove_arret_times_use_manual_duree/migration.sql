/*
  Warnings:

  - You are about to drop the column `heureDebut` on the `ProductionArret` table. All the data in the column will be lost.
  - You are about to drop the column `heureFin` on the `ProductionArret` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductionInventory" DROP CONSTRAINT "ProductionInventory_productionCenterId_fkey";

-- AlterTable
ALTER TABLE "ProductionArret" DROP COLUMN "heureDebut",
DROP COLUMN "heureFin";

-- AlterTable
ALTER TABLE "Reservoir" RENAME CONSTRAINT "Sphere_pkey" TO "Reservoir_pkey";

-- AlterTable
ALTER TABLE "Reservoir" ALTER COLUMN "hauteur" SET DEFAULT 0,
ALTER COLUMN "densiteA15C" SET DEFAULT 0;

-- RenameForeignKey
ALTER TABLE "Reservoir" RENAME CONSTRAINT "Sphere_inventoryId_fkey" TO "Reservoir_inventoryId_fkey";

-- AddForeignKey
ALTER TABLE "ProductionInventory" ADD CONSTRAINT "ProductionInventory_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
