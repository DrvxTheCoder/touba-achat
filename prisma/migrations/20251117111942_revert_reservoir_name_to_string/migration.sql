-- Revert Reservoir.name and ReservoirConfig.name from SphereType enum back to TEXT
-- This allows for flexible reservoir naming (SO2, SO3, D100, RO1, RO2, etc.)

-- Step 1: Add temporary text columns
ALTER TABLE "Reservoir" ADD COLUMN IF NOT EXISTS "name_text" TEXT;
ALTER TABLE "ReservoirConfig" ADD COLUMN IF NOT EXISTS "name_text" TEXT;

-- Step 2: Copy enum values to text columns
UPDATE "Reservoir" SET "name_text" = "name"::text;
UPDATE "ReservoirConfig" SET "name_text" = "name"::text;

-- Step 3: Drop unique constraints that depend on the name column
DROP INDEX IF EXISTS "Reservoir_inventoryId_name_key";
DROP INDEX IF EXISTS "ReservoirConfig_name_productionCenterId_key";

-- Step 4: Drop old enum columns
ALTER TABLE "Reservoir" DROP COLUMN "name";
ALTER TABLE "ReservoirConfig" DROP COLUMN "name";

-- Step 5: Rename text columns to name
ALTER TABLE "Reservoir" RENAME COLUMN "name_text" TO "name";
ALTER TABLE "ReservoirConfig" RENAME COLUMN "name_text" TO "name";

-- Step 6: Set NOT NULL constraint
ALTER TABLE "Reservoir" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "ReservoirConfig" ALTER COLUMN "name" SET NOT NULL;

-- Step 7: Recreate unique constraints
CREATE UNIQUE INDEX "Reservoir_inventoryId_name_key" ON "Reservoir"("inventoryId", "name");
CREATE UNIQUE INDEX "ReservoirConfig_name_productionCenterId_key" ON "ReservoirConfig"("name", "productionCenterId");
