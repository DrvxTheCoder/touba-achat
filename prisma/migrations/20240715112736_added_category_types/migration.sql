-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('DEFAULT', 'CUSTOM');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'CUSTOM';
