/*
  Warnings:

  - You are about to drop the column `employeeId` on the `EtatDeBesoin` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `OrdreDeMission` table. All the data in the column will be lost.
  - Added the required column `userCreatorId` to the `EtatDeBesoin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userCreatorId` to the `OrdreDeMission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmployeeDepartmentHistory" DROP CONSTRAINT "EmployeeDepartmentHistory_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeDepartmentHistory" DROP CONSTRAINT "EmployeeDepartmentHistory_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "OrdreDeMission" DROP CONSTRAINT "OrdreDeMission_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "OrdreDeMission" DROP CONSTRAINT "OrdreDeMission_employeeId_fkey";

-- AlterTable
ALTER TABLE "EmployeeDepartmentHistory" ALTER COLUMN "startDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EtatDeBesoin" DROP COLUMN "employeeId",
ADD COLUMN     "userCreatorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OrdreDeMission" DROP COLUMN "employeeId",
ADD COLUMN     "userCreatorId" INTEGER NOT NULL;

-- RenameForeignKey
ALTER TABLE "Employee" RENAME CONSTRAINT "Employee_departmentId_fkey" TO "Employee_currentDepartmentId_fkey";

-- AddForeignKey
ALTER TABLE "EmployeeDepartmentHistory" ADD CONSTRAINT "EmployeeDepartmentHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDepartmentHistory" ADD CONSTRAINT "EmployeeDepartmentHistory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreDeMission" ADD CONSTRAINT "OrdreDeMission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreDeMission" ADD CONSTRAINT "OrdreDeMission_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
