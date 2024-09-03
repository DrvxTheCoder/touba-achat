-- CreateEnum
CREATE TYPE "ODMEventType" AS ENUM ('DRAFT', 'SUBMITTED', 'AWAITING_DIRECTOR_APPROVAL', 'AWAITING_RH_PROCESSING', 'RH_PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "OrdreDeMissionAuditLog" (
    "id" SERIAL NOT NULL,
    "ordreDeMissionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" "ODMEventType" NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "OrdreDeMissionAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrdreDeMissionAuditLog" ADD CONSTRAINT "OrdreDeMissionAuditLog_ordreDeMissionId_fkey" FOREIGN KEY ("ordreDeMissionId") REFERENCES "OrdreDeMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreDeMissionAuditLog" ADD CONSTRAINT "OrdreDeMissionAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
