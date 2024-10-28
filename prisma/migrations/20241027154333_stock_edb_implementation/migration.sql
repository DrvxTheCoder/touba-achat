-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "EtatDeBesoin" DROP CONSTRAINT "EtatDeBesoin_userCreatorId_fkey";

-- AlterTable
ALTER TABLE "EtatDeBesoin" ADD COLUMN     "EmployeeName" TEXT,
ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "userCreatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoin" ADD CONSTRAINT "EtatDeBesoin_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
