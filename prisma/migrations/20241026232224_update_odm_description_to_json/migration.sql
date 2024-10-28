-- Step 1: Add a new temporary column
ALTER TABLE "OrdreDeMission" ADD COLUMN "description_json" JSONB;

-- Step 2: Convert existing data
UPDATE "OrdreDeMission" 
SET "description_json" = jsonb_build_object(
    'type', 'doc',
    'content', ARRAY[jsonb_build_object(
        'type', 'paragraph',
        'content', ARRAY[jsonb_build_object(
            'type', 'text',
            'text', description
        )]
    )]
);

-- Step 3: Drop the old column
ALTER TABLE "OrdreDeMission" DROP COLUMN "description";

-- Step 4: Rename the new column to the original name
ALTER TABLE "OrdreDeMission" RENAME COLUMN "description_json" TO "description";

-- Step 5: Make the column required
ALTER TABLE "OrdreDeMission" ALTER COLUMN "description" SET NOT NULL;