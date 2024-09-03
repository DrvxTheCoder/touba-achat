/*
  Warnings:

  - The values [APPROVED_DIRECTEUR,APPROVED_RH] on the enum `ODMStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ODMStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'AWAITING_DIRECTOR_APPROVAL', 'AWAITING_RH_PROCESSING', 'RH_PROCESSING', 'COMPLETED', 'REJECTED');
ALTER TABLE "OrdreDeMission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrdreDeMission" ALTER COLUMN "status" TYPE "ODMStatus_new" USING ("status"::text::"ODMStatus_new");
ALTER TYPE "ODMStatus" RENAME TO "ODMStatus_old";
ALTER TYPE "ODMStatus_new" RENAME TO "ODMStatus";
DROP TYPE "ODMStatus_old";
ALTER TABLE "OrdreDeMission" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
