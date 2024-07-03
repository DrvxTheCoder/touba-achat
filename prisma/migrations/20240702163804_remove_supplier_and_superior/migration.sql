/*
  Warnings:

  - You are about to drop the column `budgetId` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - The `status` column on the `EtatDeBesoin` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `budgetId` on the `OrdreDeMission` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `OrdreDeMission` table. All the data in the column will be lost.
  - The `status` column on the `OrdreDeMission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Budget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `EtatDeBesoin` table without a default value. This is not possible if the table is not empty.
  - Made the column `employeeId` on table `EtatDeBesoin` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `receiverId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.
  - Made the column `employeeId` on table `OrdreDeMission` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EDB_CREATED', 'EDB_APPROVED_SUPERIOR', 'EDB_APPROVED_DIRECTOR', 'EDB_ESCALATED', 'EDB_APPROVED_DG', 'ODM_CREATED', 'ODM_APPROVED_DIRECTOR', 'ODM_APPROVED_RH');

-- CreateEnum
CREATE TYPE "EDBStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'APPROVED_DG', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ODMStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED_DIRECTEUR', 'APPROVED_RH', 'REJECTED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'AUDIT';

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrdreDeMission" DROP CONSTRAINT "OrdreDeMission_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "OrdreDeMission" DROP CONSTRAINT "OrdreDeMission_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "OrdreDeMission" DROP CONSTRAINT "OrdreDeMission_userId_fkey";

-- AlterTable
ALTER TABLE "EtatDeBesoin" DROP COLUMN "budgetId",
DROP COLUMN "supplierId",
DROP COLUMN "userId",
ADD COLUMN     "approverId" INTEGER,
ADD COLUMN     "attachments" TEXT[],
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "isEscalated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "references" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "EDBStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "employeeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "userId",
ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiverId" INTEGER NOT NULL,
ADD COLUMN     "senderId" INTEGER NOT NULL,
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "OrdreDeMission" DROP COLUMN "budgetId",
DROP COLUMN "userId",
ADD COLUMN     "approverId" INTEGER,
ADD COLUMN     "creatorId" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ODMStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "employeeId" SET NOT NULL;

-- DropTable
DROP TABLE "Budget";

-- DropTable
DROP TABLE "Supplier";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreDeMission" ADD CONSTRAINT "OrdreDeMission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreDeMission" ADD CONSTRAINT "OrdreDeMission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreDeMission" ADD CONSTRAINT "OrdreDeMission_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
