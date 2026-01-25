-- Drop the old unique constraint on date only (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ProductionInventory_date_key'
        AND conrelid = '"ProductionInventory"'::regclass
    ) THEN
        ALTER TABLE "ProductionInventory" DROP CONSTRAINT "ProductionInventory_date_key";
    END IF;
END $$;

-- Add new compound unique constraint on date and productionCenterId
CREATE UNIQUE INDEX IF NOT EXISTS "ProductionInventory_date_productionCenterId_key" ON "ProductionInventory"("date", "productionCenterId");
