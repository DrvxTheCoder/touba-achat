-- Update existing NULL values to copy from temperature field
UPDATE "Reservoir" SET "temperatureVapeur" = "temperature" WHERE "temperatureVapeur" IS NULL;

-- Make the column NOT NULL with default
ALTER TABLE "Reservoir" ALTER COLUMN "temperatureVapeur" SET NOT NULL;
ALTER TABLE "Reservoir" ALTER COLUMN "temperatureVapeur" SET DEFAULT 20;
