/*
  Warnings:

  - A unique constraint covering the columns `[matriculation]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `matriculation` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "matriculation" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_matriculation_key" ON "Employee"("matriculation");
