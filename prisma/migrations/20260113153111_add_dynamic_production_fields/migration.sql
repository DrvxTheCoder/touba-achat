-- AlterTable
ALTER TABLE "ProductionCenter" ADD COLUMN     "capacityPerLine" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
ADD COLUMN     "numberOfLines" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "totalHourlyCapacity" DOUBLE PRECISION NOT NULL DEFAULT 24.0;

-- AlterTable
ALTER TABLE "ProductionInventory" ADD COLUMN     "useDynamicFields" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ApproFieldConfig" (
    "id" SERIAL NOT NULL,
    "productionCenterId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApproFieldConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SortieFieldConfig" (
    "id" SERIAL NOT NULL,
    "productionCenterId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SortieFieldConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApproValue" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "fieldConfigId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApproValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SortieValue" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "fieldConfigId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SortieValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApproFieldConfig_productionCenterId_isActive_idx" ON "ApproFieldConfig"("productionCenterId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ApproFieldConfig_productionCenterId_name_key" ON "ApproFieldConfig"("productionCenterId", "name");

-- CreateIndex
CREATE INDEX "SortieFieldConfig_productionCenterId_isActive_idx" ON "SortieFieldConfig"("productionCenterId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SortieFieldConfig_productionCenterId_name_key" ON "SortieFieldConfig"("productionCenterId", "name");

-- CreateIndex
CREATE INDEX "ApproValue_inventoryId_idx" ON "ApproValue"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ApproValue_inventoryId_fieldConfigId_key" ON "ApproValue"("inventoryId", "fieldConfigId");

-- CreateIndex
CREATE INDEX "SortieValue_inventoryId_idx" ON "SortieValue"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SortieValue_inventoryId_fieldConfigId_key" ON "SortieValue"("inventoryId", "fieldConfigId");

-- AddForeignKey
ALTER TABLE "ApproFieldConfig" ADD CONSTRAINT "ApproFieldConfig_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortieFieldConfig" ADD CONSTRAINT "SortieFieldConfig_productionCenterId_fkey" FOREIGN KEY ("productionCenterId") REFERENCES "ProductionCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproValue" ADD CONSTRAINT "ApproValue_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproValue" ADD CONSTRAINT "ApproValue_fieldConfigId_fkey" FOREIGN KEY ("fieldConfigId") REFERENCES "ApproFieldConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortieValue" ADD CONSTRAINT "SortieValue_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortieValue" ADD CONSTRAINT "SortieValue_fieldConfigId_fkey" FOREIGN KEY ("fieldConfigId") REFERENCES "SortieFieldConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
