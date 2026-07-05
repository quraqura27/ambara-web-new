ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_bank_account_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_bank_account_check
  CHECK (bank_account IS NULL OR bank_account IN ('OCBC', 'MANDIRI', 'BCA'));
