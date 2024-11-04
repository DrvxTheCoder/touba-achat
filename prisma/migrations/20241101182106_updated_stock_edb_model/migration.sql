/*
  Warnings:

  - Added the required column `updatedAt` to the `StockEtatDeBesoin` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StockEDBStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ORDERED', 'DELIVERED', 'CONVERTED');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "jobTitle" TEXT NOT NULL DEFAULT 'Employé';

-- AlterTable
ALTER TABLE "StockEtatDeBesoin" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "convertedById" INTEGER,
ADD COLUMN     "convertedEdbId" INTEGER,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveredById" INTEGER,
ADD COLUMN     "orderedAt" TIMESTAMP(3),
ADD COLUMN     "orderedById" INTEGER,
ADD COLUMN     "status" "StockEDBStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_convertedById_fkey" FOREIGN KEY ("convertedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
