-- =============================================
-- DATA MIGRATION: Convert legacy ODM statuses
-- =============================================

-- Migrate AWAITING_FINANCE_APPROVAL -> READY_FOR_PRINT
UPDATE "OrdreDeMission"
SET status = 'READY_FOR_PRINT'
WHERE status = 'AWAITING_FINANCE_APPROVAL';

-- Migrate AWAITING_RH_PROCESSING -> AWAITING_DRH_APPROVAL
UPDATE "OrdreDeMission"
SET status = 'AWAITING_DRH_APPROVAL'
WHERE status = 'AWAITING_RH_PROCESSING';

-- Migrate COMPLETED -> READY_FOR_PRINT
UPDATE "OrdreDeMission"
SET status = 'READY_FOR_PRINT'
WHERE status = 'COMPLETED';
