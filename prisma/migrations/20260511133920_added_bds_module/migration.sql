-- CreateEnum
CREATE TYPE "BDSType" AS ENUM ('PERSONNEL', 'MATERIEL');

-- CreateEnum
CREATE TYPE "BDSStatus" AS ENUM ('SUBMITTED', 'VALIDATED', 'COMPLETED', 'RETURNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BDSEventType" AS ENUM ('SUBMITTED', 'VALIDATED', 'COMPLETED', 'RETURNED', 'REJECTED', 'UPDATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Access" ADD VALUE 'APPROVE_BDS';
ALTER TYPE "Access" ADD VALUE 'VIEW_ALL_BDS';
ALTER TYPE "Access" ADD VALUE 'CREATE_BDS_MATERIEL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BDS_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'BDS_VALIDATED';
ALTER TYPE "NotificationType" ADD VALUE 'BDS_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'BDS_RETURNED';
ALTER TYPE "NotificationType" ADD VALUE 'BDS_REJECTED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GARDIEN';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "bonDeSortieId" INTEGER;

-- CreateTable
CREATE TABLE "BonDeSortie" (
    "id" SERIAL NOT NULL,
    "bdsId" TEXT NOT NULL,
    "type" "BDSType" NOT NULL,
    "motif" TEXT NOT NULL,
    "destination" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "heureSortie" TEXT,
    "heureRetour" TEXT,
    "heureSortieEffective" TEXT,
    "heureRetourEffective" TEXT,
    "comment" TEXT,
    "employees" JSONB,
    "vehicule" TEXT,
    "chauffeur" TEXT,
    "items" JSONB,
    "nombreColis" INTEGER,
    "status" "BDSStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "userCreatorId" INTEGER NOT NULL,
    "validatorId" INTEGER,
    "rejectorId" INTEGER,
    "completedById" INTEGER,
    "completedAt" TIMESTAMP(3),
    "returnedById" INTEGER,
    "returnedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "BonDeSortie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonDeSortieAuditLog" (
    "id" SERIAL NOT NULL,
    "bonDeSortieId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" "BDSEventType" NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "BonDeSortieAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonDeSortie_bdsId_key" ON "BonDeSortie"("bdsId");

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_rejectorId_fkey" FOREIGN KEY ("rejectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortie" ADD CONSTRAINT "BonDeSortie_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortieAuditLog" ADD CONSTRAINT "BonDeSortieAuditLog_bonDeSortieId_fkey" FOREIGN KEY ("bonDeSortieId") REFERENCES "BonDeSortie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonDeSortieAuditLog" ADD CONSTRAINT "BonDeSortieAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bonDeSortieId_fkey" FOREIGN KEY ("bonDeSortieId") REFERENCES "BonDeSortie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
