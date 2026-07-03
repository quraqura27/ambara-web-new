CREATE TABLE IF NOT EXISTS invoice_sequences (
  year integer PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS customer_code text,
  ADD COLUMN IF NOT EXISTS customer_name_snapshot text,
  ADD COLUMN IF NOT EXISTS customer_address_snapshot text,
  ADD COLUMN IF NOT EXISTS customer_npwp_snapshot text,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 1.1,
  ADD COLUMN IF NOT EXISTS pph_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pph_rate numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS pph_base_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pph_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_payable numeric,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'finalized',
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_checksum text,
  ADD COLUMN IF NOT EXISTS withholding_proof_ref text;

UPDATE invoices
SET net_payable = COALESCE(amount_due, total, 0)
WHERE net_payable IS NULL;

CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_verification_token_unique_idx
  ON invoices (verification_token)
  WHERE verification_token IS NOT NULL
    AND btrim(verification_token) <> '';

CREATE INDEX IF NOT EXISTS invoice_line_items_invoice_idx
  ON invoice_line_items (invoice_id, sort_order);

CREATE INDEX IF NOT EXISTS invoice_deductions_invoice_idx
  ON invoice_deductions (invoice_id, sort_order);
