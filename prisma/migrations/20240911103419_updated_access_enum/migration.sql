-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Access" ADD VALUE 'APPROVE_ODM';
ALTER TYPE "Access" ADD VALUE 'RH_APPROVE';
ALTER TYPE "Access" ADD VALUE 'RH_PROCESS';
