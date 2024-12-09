-- CreateEnum
CREATE TYPE "BDCStatus" AS ENUM ('SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'PRINTED', 'REJECTED', 'UPDATED');

-- CreateEnum
CREATE TYPE "BDCEventType" AS ENUM ('SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'REJECTED', 'COMPLETED', 'UPDATED', 'PRINTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BDC_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'BDC_APPROVED_RESPONSABLE';
ALTER TYPE "NotificationType" ADD VALUE 'BDC_APPROVED_DIRECTOR';
ALTER TYPE "NotificationType" ADD VALUE 'BDC_PRINTED';
ALTER TYPE "NotificationType" ADD VALUE 'BDC_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'DAF';
ALTER TYPE "Role" ADD VALUE 'DOG';
ALTER TYPE "Role" ADD VALUE 'DRH';
ALTER TYPE "Role" ADD VALUE 'DCM';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "bonDeCaisseId" INTEGER;

-- CreateTable
CREATE TABLE "BonDeCaisse" (
    "id" SERIAL NOT NULL,
    "bdcId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "employees" JSONB NOT NULL,
    "comment" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BDCStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "userCreatorId" INTEGER NOT NULL,
    "approverId" INTEGER,
    "printedById" INTEGER,
    "printedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "BonDeCaisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonDeCaisseAuditLog" (
    "id" SERIAL NOT NULL,
    "bonDeCaisseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" "BDCEventType" NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "BonDeCaisseAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonDeCaisse_bdcId_key" ON "BonDeCaisse"("bdcId");

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_printedById_fkey" FOREIGN KEY ("printedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeCaisseAuditLog" ADD CONSTRAINT "BonDeCaisseAuditLog_bonDeCaisseId_fkey" FOREIGN KEY ("bonDeCaisseId") REFERENCES "BonDeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeCaisseAuditLog" ADD CONSTRAINT "BonDeCaisseAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bonDeCaisseId_fkey" FOREIGN KEY ("bonDeCaisseId") REFERENCES "BonDeCaisse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
