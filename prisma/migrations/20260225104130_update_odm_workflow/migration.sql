-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Access" ADD VALUE 'ODM_DIRECTOR_APPROVE';
ALTER TYPE "Access" ADD VALUE 'ODM_DRH_APPROVE';
ALTER TYPE "Access" ADD VALUE 'ODM_RH_PROCESS';
ALTER TYPE "Access" ADD VALUE 'ODM_DOG_APPROVE';
ALTER TYPE "Access" ADD VALUE 'ODM_PRINT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ODMEventType" ADD VALUE 'AWAITING_DRH_APPROVAL';
ALTER TYPE "ODMEventType" ADD VALUE 'AWAITING_DRH_VALIDATION';
ALTER TYPE "ODMEventType" ADD VALUE 'AWAITING_DOG_APPROVAL';
ALTER TYPE "ODMEventType" ADD VALUE 'READY_FOR_PRINT';
ALTER TYPE "ODMEventType" ADD VALUE 'RESTARTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ODMStatus" ADD VALUE 'AWAITING_DRH_APPROVAL';
ALTER TYPE "ODMStatus" ADD VALUE 'AWAITING_DRH_VALIDATION';
ALTER TYPE "ODMStatus" ADD VALUE 'AWAITING_DOG_APPROVAL';
ALTER TYPE "ODMStatus" ADD VALUE 'READY_FOR_PRINT';
