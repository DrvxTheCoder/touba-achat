-- CreateTable: Junction table for many-to-many relationship
CREATE TABLE "ProductionCenterChef" (
    "id" SERIAL NOT NULL,
    "productionCenterId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionCenterChef_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data: Copy existing chefProductionId relationships to new junction table
INSERT INTO "ProductionCenterChef" ("productionCenterId", "userId", "createdAt")
SELECT "id", "chefProductionId", CURRENT_TIMESTAMP
FROM "ProductionCenter"
WHERE "chefProductionId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCenterChef_productionCenterId_userId_key" ON "ProductionCenterChef"("productionCenterId", "userId");

-- AddForeignKey
ALTER TABLE "ProductionCenterChef" ADD CONSTRAINT "ProductionCenterChef_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCenterChef" ADD CONSTRAINT "ProductionCenterChef_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old column (after data migration)
ALTER TABLE "ProductionCenter" DROP COLUMN "chefProductionId";
