-- Convert existing Reservoir name field from enum to string
-- The column already exists as text, we just need to ensure proper type casting

-- First, check if we need to do any conversion (the data is already there as enum values)
-- PostgreSQL will handle the enum to text conversion automatically since we renamed the table

-- Add a temporary column to store the string representation
ALTER TABLE "Reservoir" ADD COLUMN IF NOT EXISTS "name_temp" TEXT;

-- Copy enum values to the temporary string column
UPDATE "Reservoir" SET "name_temp" = "name"::text WHERE "name_temp" IS NULL;

-- Drop the old enum-based name column
ALTER TABLE "Reservoir" DROP COLUMN "name";

-- Rename the temporary column to name
ALTER TABLE "Reservoir" RENAME COLUMN "name_temp" TO "name";

-- Set the name column as NOT NULL
ALTER TABLE "Reservoir" ALTER COLUMN "name" SET NOT NULL;

-- Recreate the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Reservoir_inventoryId_name_key" ON "Reservoir"("inventoryId", "name");
