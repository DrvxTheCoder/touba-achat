/*
  Warnings:

  - Made the column `eventType` on table `EtatDeBesoinAuditLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "EDBStatus" ADD VALUE 'ESCALATED';

-- AlterTable
ALTER TABLE "EtatDeBesoinAuditLog" ALTER COLUMN "eventType" SET NOT NULL;
