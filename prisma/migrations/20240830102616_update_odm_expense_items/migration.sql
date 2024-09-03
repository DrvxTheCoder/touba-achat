/*
  Warnings:

  - You are about to drop the `ExpenseItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- Step 1: Add the new JSON column to OrdreDeMission
ALTER TABLE "OrdreDeMission" ADD COLUMN "expenseItems" JSONB;

-- Step 2: Migrate existing ExpenseItem data to the new JSON column
UPDATE "OrdreDeMission" AS odm
SET "expenseItems" = (
  SELECT jsonb_agg(jsonb_build_object(
    'type', ei.type,
    'amount', ei.amount,
    'description', ei.description
  ))
  FROM "ExpenseItem" AS ei
  WHERE ei."ordreDeMissionId" = odm.id
);

-- Step 3: Drop the ExpenseItem table
DROP TABLE "ExpenseItem";

-- Step 4: Remove the relation field from OrdreDeMission if it exists
-- (You may need to adjust this if the field name is different)
ALTER TABLE "OrdreDeMission" DROP COLUMN IF EXISTS "expenseItemsId";
