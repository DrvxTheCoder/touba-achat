-- AlterEnum
ALTER TYPE "Access" ADD VALUE 'CREATE_ODM';

-- AlterEnum
ALTER TYPE "EDBEventType" ADD VALUE 'DELIVERED';

-- AlterEnum
ALTER TYPE "EDBStatus" ADD VALUE 'DELIVERED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'EDB_DELIVERED';
ALTER TYPE "NotificationType" ADD VALUE 'ODM_AWAITING_FINANCE_APPROVAL';

-- AlterEnum
ALTER TYPE "ODMEventType" ADD VALUE 'AWAITING_FINANCE_APPROVAL';

-- AlterEnum
ALTER TYPE "ODMStatus" ADD VALUE 'AWAITING_FINANCE_APPROVAL';
