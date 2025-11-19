-- Convert Reservoir.name and ReservoirConfig.name from TEXT to SphereType enum

-- Step 1: Add temporary columns with SphereType type
ALTER TABLE "Reservoir" ADD COLUMN IF NOT EXISTS "name_enum" "SphereType";
ALTER TABLE "ReservoirConfig" ADD COLUMN IF NOT EXISTS "name_enum" "SphereType";

-- Step 2: Copy text values to enum columns (casting from text to enum)
UPDATE "Reservoir" SET "name_enum" = "name"::"SphereType";
UPDATE "ReservoirConfig" SET "name_enum" = "name"::"SphereType";

-- Step 3: Drop unique constraints that depend on the old name column
DROP INDEX IF EXISTS "Reservoir_inventoryId_name_key";
DROP INDEX IF EXISTS "ReservoirConfig_name_productionCenterId_key";

-- Step 4: Drop old text columns
ALTER TABLE "Reservoir" DROP COLUMN "name";
ALTER TABLE "ReservoirConfig" DROP COLUMN "name";

-- Step 5: Rename enum columns to name
ALTER TABLE "Reservoir" RENAME COLUMN "name_enum" TO "name";
ALTER TABLE "ReservoirConfig" RENAME COLUMN "name_enum" TO "name";

-- Step 6: Recreate unique constraints
CREATE UNIQUE INDEX "Reservoir_inventoryId_name_key" ON "Reservoir"("inventoryId", "name");
CREATE UNIQUE INDEX "ReservoirConfig_name_productionCenterId_key" ON "ReservoirConfig"("name", "productionCenterId");
