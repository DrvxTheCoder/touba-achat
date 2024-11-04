/*
  Warnings:

  - A unique constraint covering the columns `[convertedEdbId]` on the table `StockEtatDeBesoin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StockEtatDeBesoin_convertedEdbId_key" ON "StockEtatDeBesoin"("convertedEdbId");

-- AddForeignKey
ALTER TABLE "StockEtatDeBesoin" ADD CONSTRAINT "StockEtatDeBesoin_convertedEdbId_fkey" FOREIGN KEY ("convertedEdbId") REFERENCES "EtatDeBesoin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
