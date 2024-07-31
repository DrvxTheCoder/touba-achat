-- Step 1: Create the new enum type
CREATE TYPE "EDBEventType_new" AS ENUM ('DRAFT_CREATED', 'SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'APPROVED_DG', 'REJECTED', 'UPDATED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'ESCALATED', 'MAGASINIER_ATTACHED', 'SUPPLIER_CHOSEN', 'IT_APPROVED', 'COMPLETED');

-- Step 2: Add a new column with the new enum type
ALTER TABLE "EtatDeBesoinAuditLog" ADD COLUMN "eventType_new" "EDBEventType_new";

-- Step 3: Update the new column based on the old column
UPDATE "EtatDeBesoinAuditLog" SET "eventType_new" = 
  CASE "eventType"::text
    WHEN 'CREATED' THEN 'DRAFT_CREATED'
    WHEN 'SUBMITTED' THEN 'SUBMITTED'
    WHEN 'APPROVED_RESPONSABLE' THEN 'APPROVED_RESPONSABLE'
    WHEN 'APPROVED_DIRECTEUR' THEN 'APPROVED_DIRECTEUR'
    WHEN 'APPROVED_DG' THEN 'APPROVED_DG'
    WHEN 'REJECTED' THEN 'REJECTED'
    WHEN 'UPDATED' THEN 'UPDATED'
    WHEN 'ATTACHMENT_ADDED' THEN 'ATTACHMENT_ADDED'
    WHEN 'ATTACHMENT_REMOVED' THEN 'ATTACHMENT_REMOVED'
    WHEN 'ESCALATED' THEN 'ESCALATED'
    ELSE 'UPDATED' -- Default case, adjust as needed
  END::text::"EDBEventType_new";

-- Step 4: Drop the old column and rename the new one
ALTER TABLE "EtatDeBesoinAuditLog" DROP COLUMN "eventType";
ALTER TABLE "EtatDeBesoinAuditLog" RENAME COLUMN "eventType_new" TO "eventType";

-- Step 5: Drop the old enum type
DROP TYPE "EDBEventType";

-- Step 6: Rename the new enum type to the original name
ALTER TYPE "EDBEventType_new" RENAME TO "EDBEventType";