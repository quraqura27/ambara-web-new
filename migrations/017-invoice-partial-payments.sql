CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  amount numeric(18, 2) NOT NULL,
  payment_date date,
  reference text,
  note text,
  recorded_by integer REFERENCES staff_accounts(id),
  source text NOT NULL DEFAULT 'portal',
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  voided_by integer REFERENCES staff_accounts(id),
  void_reason text,
  CONSTRAINT invoice_payments_amount_check CHECK (amount > 0),
  CONSTRAINT invoice_payments_source_check CHECK (source IN ('portal', 'legacy_backfill')),
  CONSTRAINT invoice_payments_void_check CHECK (
    (voided_at IS NULL AND voided_by IS NULL AND void_reason IS NULL)
    OR
    (voided_at IS NOT NULL AND voided_by IS NOT NULL AND btrim(void_reason) <> '')
  )
);

CREATE INDEX IF NOT EXISTS invoice_payments_invoice_date_idx
  ON invoice_payments (invoice_id, payment_date, created_at);

CREATE INDEX IF NOT EXISTS invoice_payments_active_invoice_idx
  ON invoice_payments (invoice_id)
  WHERE voided_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_legacy_invoice_unique_idx
  ON invoice_payments (invoice_id)
  WHERE source = 'legacy_backfill';

INSERT INTO invoice_payments (
  invoice_id,
  amount,
  payment_date,
  reference,
  recorded_by,
  source,
  created_at
)
SELECT
  invoice.id,
  round(invoice.net_payable::numeric, 2),
  invoice.paid_at::date,
  nullif(btrim(invoice.payment_reference), ''),
  CASE
    WHEN invoice.generated_by BETWEEN -2147483648 AND 2147483647
      THEN invoice.generated_by::integer
    ELSE NULL
  END,
  'legacy_backfill',
  coalesce(invoice.paid_at, invoice.generated_at, now())
FROM invoices invoice
WHERE (invoice.status = 'paid' OR invoice.paid_at IS NOT NULL)
  AND coalesce(invoice.net_payable, 0) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM invoice_payments existing_payment
    WHERE existing_payment.invoice_id = invoice.id
      AND existing_payment.source = 'legacy_backfill'
  )
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION enforce_invoice_payment_ledger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_total numeric;
  invoice_status text;
  invoice_total numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Invoice payments are append-only. Void the payment instead.'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.voided_at IS NOT NULL
      OR NEW.voided_at IS NULL
      OR NEW.id IS DISTINCT FROM OLD.id
      OR NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
      OR NEW.amount IS DISTINCT FROM OLD.amount
      OR NEW.payment_date IS DISTINCT FROM OLD.payment_date
      OR NEW.reference IS DISTINCT FROM OLD.reference
      OR NEW.note IS DISTINCT FROM OLD.note
      OR NEW.recorded_by IS DISTINCT FROM OLD.recorded_by
      OR NEW.source IS DISTINCT FROM OLD.source
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Invoice payment entries cannot be edited. Void and re-enter the payment.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  SELECT invoice.status, coalesce(invoice.net_payable, 0)
  INTO invoice_status, invoice_total
  FROM invoices invoice
  WHERE invoice.id = NEW.invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found for payment.'
      USING ERRCODE = '23503';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.source <> 'legacy_backfill' AND invoice_status <> 'sent' THEN
    RAISE EXCEPTION 'Payments can only be recorded against sent invoices.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.source <> 'legacy_backfill' THEN
    IF NEW.payment_date IS NULL OR NEW.payment_date > current_date THEN
      RAISE EXCEPTION 'Choose a valid payment date that is not in the future.'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.reference IS NULL OR btrim(NEW.reference) = '' THEN
      RAISE EXCEPTION 'Payment reference is required.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.voided_at IS NULL THEN
    SELECT coalesce(sum(payment.amount), 0)
    INTO active_total
    FROM invoice_payments payment
    WHERE payment.invoice_id = NEW.invoice_id
      AND payment.voided_at IS NULL
      AND payment.id <> NEW.id;

    IF round(active_total + NEW.amount, 2) > round(invoice_total, 2) THEN
      RAISE EXCEPTION 'Payment exceeds the outstanding invoice balance.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_invoice_payment_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_total numeric;
  settlement_date date;
  settlement_reference text;
BEGIN
  SELECT
    coalesce(sum(payment.amount), 0),
    (
      SELECT latest.payment_date
      FROM invoice_payments latest
      WHERE latest.invoice_id = NEW.invoice_id
        AND latest.voided_at IS NULL
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    ),
    (
      SELECT latest.reference
      FROM invoice_payments latest
      WHERE latest.invoice_id = NEW.invoice_id
        AND latest.voided_at IS NULL
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    )
  INTO active_total, settlement_date, settlement_reference
  FROM invoice_payments payment
  WHERE payment.invoice_id = NEW.invoice_id
    AND payment.voided_at IS NULL;

  UPDATE invoices invoice
  SET
    status = CASE
      WHEN invoice.status IN ('draft', 'archived', 'voided') THEN invoice.status
      WHEN coalesce(invoice.net_payable, 0) > 0
        AND round(active_total, 2) >= round(invoice.net_payable, 2)
        THEN 'paid'
      ELSE 'sent'
    END,
    paid_at = CASE
      WHEN coalesce(invoice.net_payable, 0) > 0
        AND round(active_total, 2) >= round(invoice.net_payable, 2)
        THEN settlement_date::timestamp
      ELSE NULL
    END,
    payment_reference = CASE
      WHEN coalesce(invoice.net_payable, 0) > 0
        AND round(active_total, 2) >= round(invoice.net_payable, 2)
        THEN settlement_reference
      ELSE NULL
    END
  WHERE invoice.id = NEW.invoice_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_invoice_void_with_active_payments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'voided'
    AND OLD.status <> 'voided'
    AND EXISTS (
      SELECT 1
      FROM invoice_payments payment
      WHERE payment.invoice_id = NEW.id
        AND payment.voided_at IS NULL
    )
  THEN
    RAISE EXCEPTION 'Void active payments before voiding this invoice.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoice_payments_enforce_ledger ON invoice_payments;
CREATE TRIGGER invoice_payments_enforce_ledger
BEFORE INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION enforce_invoice_payment_ledger();

DROP TRIGGER IF EXISTS invoice_payments_sync_invoice ON invoice_payments;
CREATE TRIGGER invoice_payments_sync_invoice
AFTER INSERT OR UPDATE OF voided_at ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_payment_state();

DROP TRIGGER IF EXISTS invoices_prevent_void_with_payments ON invoices;
CREATE TRIGGER invoices_prevent_void_with_payments
BEFORE UPDATE OF status ON invoices
FOR EACH ROW
EXECUTE FUNCTION prevent_invoice_void_with_active_payments();
