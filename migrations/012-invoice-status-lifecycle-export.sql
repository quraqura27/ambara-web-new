ALTER TABLE invoices
  ALTER COLUMN invoice_number DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_reference text;

UPDATE invoices
SET
  status = 'sent',
  sent_at = COALESCE(sent_at, generated_at)
WHERE COALESCE(status, 'finalized') = 'finalized';

UPDATE invoices
SET status = 'sent'
WHERE status IS NULL;

ALTER TABLE invoices
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE invoices
    ADD CONSTRAINT invoices_status_check
    CHECK (status IN ('draft', 'sent', 'paid', 'archived', 'voided', 'finalized'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_unique_idx
  ON invoices (invoice_number)
  WHERE invoice_number IS NOT NULL
    AND btrim(invoice_number) <> '';

CREATE INDEX IF NOT EXISTS invoices_sent_at_idx ON invoices (sent_at);
CREATE INDEX IF NOT EXISTS invoices_paid_at_idx ON invoices (paid_at);
