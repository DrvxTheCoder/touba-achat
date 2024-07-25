-- CreateEnum
CREATE TYPE "EDBEventType" AS ENUM ('CREATED', 'SUBMITTED', 'APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'APPROVED_DG', 'REJECTED', 'UPDATED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'ESCALATED');

-- new JSONB column
ALTER TABLE "EtatDeBesoin" ADD COLUMN "description_json" JSONB;

-- Function to parse the description strings
CREATE OR REPLACE FUNCTION parse_description(description_item text)
RETURNS json AS $$
DECLARE
    item_name text;
    item_quantity int;
BEGIN
    item_name := substring(description_item from '^(.+) \(Quantité: \d+\)$');
    item_quantity := (regexp_matches(description_item, 'Quantité: (\d+)'))[1]::int;
    RETURN json_build_object('designation', item_name, 'quantity', item_quantity);
END;
$$ LANGUAGE plpgsql;

-- Migrate data from the old column to the new one
UPDATE "EtatDeBesoin"
SET "description_json" = json_build_object('items', (
    SELECT json_agg(parse_description(x))
    FROM unnest("description") AS x
));

DROP FUNCTION parse_description(text);

ALTER TABLE "EtatDeBesoin" DROP COLUMN "description";
ALTER TABLE "EtatDeBesoin" RENAME COLUMN "description_json" TO "description";

-- Make the new column NOT NULL
ALTER TABLE "EtatDeBesoin" ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "EtatDeBesoinAuditLog" (
    "id" SERIAL NOT NULL,
    "etatDeBesoinId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" "EDBEventType" NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "EtatDeBesoinAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EtatDeBesoinAuditLog" ADD CONSTRAINT "EtatDeBesoinAuditLog_etatDeBesoinId_fkey" FOREIGN KEY ("etatDeBesoinId") REFERENCES "EtatDeBesoin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDeBesoinAuditLog" ADD CONSTRAINT "EtatDeBesoinAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;