-- AlterEnum
ALTER TYPE "StockEDBStatus" ADD VALUE 'PARTIALLY_DELIVERED';

-- AlterTable
ALTER TABLE "StockEtatDeBesoin" ADD COLUMN     "deliveryHistory" JSONB,
ADD COLUMN     "isFullyDelivered" BOOLEAN NOT NULL DEFAULT false;
