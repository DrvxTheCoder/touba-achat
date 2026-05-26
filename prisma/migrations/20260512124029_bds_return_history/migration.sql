-- AlterTable
ALTER TABLE "BonDeSortie" ADD COLUMN     "isFullyReturned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnHistory" JSONB;
