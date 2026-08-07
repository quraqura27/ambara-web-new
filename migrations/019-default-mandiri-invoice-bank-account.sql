-- Migration 018 remains reserved for the separately reviewed Finance safeguards.
-- Existing invoices keep their selected bank account; this affects new rows only.
ALTER TABLE invoices
  ALTER COLUMN bank_account SET DEFAULT 'MANDIRI';
