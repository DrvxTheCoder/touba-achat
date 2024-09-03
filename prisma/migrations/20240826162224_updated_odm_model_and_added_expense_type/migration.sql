/*
  Warnings:

  - A unique constraint covering the columns `[odmId]` on the table `OrdreDeMission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endDate` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `missionType` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `odmId` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrdreDeMission" ADD COLUMN     "accompanyingPersons" JSONB,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "hasAccompanying" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "missionCostPerDay" DOUBLE PRECISION NOT NULL DEFAULT 25000,
ADD COLUMN     "missionType" TEXT NOT NULL,
ADD COLUMN     "odmId" TEXT NOT NULL,
ADD COLUMN     "rhProcessorId" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalCost" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" SERIAL NOT NULL,
    "ordreDeMissionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrdreDeMission_odmId_key" ON "OrdreDeMission"("odmId");

-- AddForeignKey
ALTER TABLE "OrdreDeMission" ADD CONSTRAINT "OrdreDeMission_rhProcessorId_fkey" FOREIGN KEY ("rhProcessorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_ordreDeMissionId_fkey" FOREIGN KEY ("ordreDeMissionId") REFERENCES "OrdreDeMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
