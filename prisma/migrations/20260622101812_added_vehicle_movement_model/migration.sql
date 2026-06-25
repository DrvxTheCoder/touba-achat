-- CreateTable
CREATE TABLE "VehicleMovement" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "dechargesComm" INTEGER NOT NULL DEFAULT 0,
    "dechargesLiv" INTEGER NOT NULL DEFAULT 0,
    "chargesComm" INTEGER NOT NULL DEFAULT 0,
    "chargesLiv" INTEGER NOT NULL DEFAULT 0,
    "nonDechargesComm" INTEGER NOT NULL DEFAULT 0,
    "nonDechargesLiv" INTEGER NOT NULL DEFAULT 0,
    "dechargesNonChargesComm" INTEGER NOT NULL DEFAULT 0,
    "dechargesNonChargesLiv" INTEGER NOT NULL DEFAULT 0,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMovement_inventoryId_key" ON "VehicleMovement"("inventoryId");

-- AddForeignKey
ALTER TABLE "VehicleMovement" ADD CONSTRAINT "VehicleMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
