-- CreateEnum
CREATE TYPE "CalculationMode" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterTable
ALTER TABLE "ReservoirConfig" ADD COLUMN     "calculationMode" "CalculationMode" NOT NULL DEFAULT 'AUTOMATIC';
