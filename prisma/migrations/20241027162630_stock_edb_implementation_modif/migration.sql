/*
  Warnings:

  - You are about to drop the column `EmployeeName` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - Made the column `creatorId` on table `EtatDeBesoin` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userCreatorId` on table `EtatDeBesoin` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_userCreatorId_fkey";

-- AlterTable
ALTER TABLE "EtatDeBesoin" DROP COLUMN "EmployeeName",
DROP COLUMN "type",
ALTER COLUMN "creatorId" SET NOT NULL,
ALTER COLUMN "userCreatorId" SET NOT NULL;

-- CreateTable
CREATE TABLE "StockEtatDeBesoin" (
    "id" SERIAL NOT NULL,
    "edbId" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER,
    "externalEmployeeName" TEXT,
    "departmentId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "StockEtatDeBesoin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockEtatDeBesoin_edbId_key" ON "StockEtatDeBesoin"("edbId");

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
