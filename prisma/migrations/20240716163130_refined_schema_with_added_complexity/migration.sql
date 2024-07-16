/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `EDBStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `attachments` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - The `description` column on the `EtatDeBesoin` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[edbId]` on the table `EtatDeBesoin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `edbId` to the `EtatDeBesoin` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Access" AS ENUM ('APPROVE_EDB', 'ATTACH_DOCUMENTS', 'CHOOSE_SUPPLIER', 'IT_APPROVAL', 'FINAL_APPROVAL');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('INITIAL', 'MAGASINIER', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "EDBStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'AWAITING_MAGASINIER', 'MAGASINIER_ATTACHED', 'AWAITING_SUPPLIER_CHOICE', 'SUPPLIER_CHOSEN', 'AWAITING_IT_APPROVAL', 'IT_APPROVED', 'AWAITING_FINAL_APPROVAL', 'APPROVED_DG', 'REJECTED', 'COMPLETED');
ALTER TABLE "EtatDeBesoin" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EtatDeBesoin" ALTER COLUMN "status" TYPE "EDBStatus_new" USING ("status"::text::"EDBStatus_new");
ALTER TYPE "EDBStatus" RENAME TO "EDBStatus_old";
ALTER TYPE "EDBStatus_new" RENAME TO "EDBStatus";
DROP TYPE "EDBStatus_old";
ALTER TABLE "EtatDeBesoin" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'IT_ADMIN';

-- AlterTable
ALTER TABLE "EtatDeBesoin" DROP COLUMN "attachments",
ADD COLUMN     "edbId" TEXT NOT NULL,
ADD COLUMN     "finalApprovedAt" TIMESTAMP(3),
ADD COLUMN     "finalApprovedBy" INTEGER,
ADD COLUMN     "itApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itApprovedAt" TIMESTAMP(3),
ADD COLUMN     "itApprovedBy" INTEGER,
ADD COLUMN     "magasinierAttachedAt" TIMESTAMP(3),
DROP COLUMN "description",
ADD COLUMN     "description" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "access" "Access"[];

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "edbId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" INTEGER NOT NULL,
    "type" "AttachmentType" NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalSupplier" (
    "id" SERIAL NOT NULL,
    "edbId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "chosenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chosenBy" INTEGER NOT NULL,

    CONSTRAINT "FinalSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinalSupplier_edbId_key" ON "FinalSupplier"("edbId");

-- CreateIndex
CREATE UNIQUE INDEX "EtatDeBesoin_edbId_key" ON "EtatDeBesoin"("edbId");

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_itApprovedBy_fkey" FOREIGN KEY ("itApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_finalApprovedBy_fkey" FOREIGN KEY ("finalApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_edbId_fkey" FOREIGN KEY ("edbId") REFERENCES "EtatDeBesoin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalSupplier" ADD CONSTRAINT "FinalSupplier_edbId_fkey" FOREIGN KEY ("edbId") REFERENCES "EtatDeBesoin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalSupplier" ADD CONSTRAINT "FinalSupplier_chosenBy_fkey" FOREIGN KEY ("chosenBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
