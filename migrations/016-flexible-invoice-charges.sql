ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS format_version integer NOT NULL DEFAULT 1;

ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS billing_basis text,
  ADD COLUMN IF NOT EXISTS reference text;

UPDATE invoices
SET format_version = 2
WHERE coalesce(status, 'sent') = 'draft';

UPDATE invoice_line_items
SET billing_basis = CASE
  WHEN line_type = 'awb' THEN 'per_kg'
  ELSE 'flat'
END
WHERE billing_basis IS NULL;

UPDATE invoice_line_items
SET reference = awb_number
WHERE reference IS NULL
  AND awb_number IS NOT NULL
  AND btrim(awb_number) <> '';

DO $$
BEGIN
  ALTER TABLE invoice_line_items
    ADD CONSTRAINT invoice_line_items_billing_basis_check
    CHECK (billing_basis IS NULL OR billing_basis IN ('per_kg', 'flat'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
