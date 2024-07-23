-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EDB_REJECTED';

-- AlterTable
ALTER TABLE "EtatDeBesoin" ADD COLUMN     "rejectionReason" TEXT;
