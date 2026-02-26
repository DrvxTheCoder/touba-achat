-- CreateTable
CREATE TABLE "InventoryAuditLog" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "editedById" INTEGER NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" JSONB NOT NULL,
    "summary" TEXT,

    CONSTRAINT "InventoryAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryAuditLog_inventoryId_idx" ON "InventoryAuditLog"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryAuditLog_editedById_idx" ON "InventoryAuditLog"("editedById");

-- CreateIndex
CREATE INDEX "InventoryAuditLog_editedAt_idx" ON "InventoryAuditLog"("editedAt");

-- AddForeignKey
ALTER TABLE "InventoryAuditLog" ADD CONSTRAINT "InventoryAuditLog_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductionInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditLog" ADD CONSTRAINT "InventoryAuditLog_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
