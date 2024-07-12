
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Mise à jour des utilisateurs existants
UPDATE "User" SET "status" = 'ACTIVE' WHERE "status" IS NULL;