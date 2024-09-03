-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ODM_RH_PROCESSING';
ALTER TYPE "NotificationType" ADD VALUE 'ODM_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'ODM_REJECTED';

-- AlterEnum
ALTER TYPE "ODMEventType" ADD VALUE 'UPDATED';

-- AlterTable
ALTER TABLE "OrdreDeMission" ADD COLUMN     "rejectionReason" TEXT;
