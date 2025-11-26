-- AlterTable
ALTER TABLE "BonDeCaisse" ADD COLUMN     "rejectorId" INTEGER;

-- AddForeignKey
ALTER TABLE "BonDeCaisse" ADD CONSTRAINT "BonDeCaisse_rejectorId_fkey" FOREIGN KEY ("rejectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
