-- AlterTable
ALTER TABLE "BonDeCaisse" ADD COLUMN     "approverDAFId" INTEGER;

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_approverDAFId_fkey" FOREIGN KEY ("approverDAFId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
