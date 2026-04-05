-- ============================================================
-- AMBARA AWB & INVOICE SYSTEM — Database Migration
-- Version: 1.0 | PostgreSQL (Neon)
-- ============================================================

-- 1. Extend customers table with invoice-related columns
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS address_line1    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line2    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS province_postal  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS npwp             VARCHAR(30),
  ADD COLUMN IF NOT EXISTS contact_person   VARCHAR(100);
-- phone and email columns already exist in the existing schema

-- 2. Update staff_accounts role constraint to include 'finance'
-- First check if there's an existing constraint and drop it, then add new one
DO $$
BEGIN
  -- Try to drop existing check constraint on role column
  BEGIN
    ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Add updated check constraint allowing finance role
  ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check
    CHECK (role IN ('superadmin', 'operations', 'finance'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Role constraint update skipped: %', SQLERRM;
END $$;

-- 3. Create awbs table
CREATE TABLE IF NOT EXISTS awbs (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id         BIGINT          NOT NULL,
  awb_number          VARCHAR(20),
  carrier             VARCHAR(100),
  origin              CHAR(3),
  destination         CHAR(3),
  flight_number       VARCHAR(20),
  shipment_date       DATE,
  pieces              INTEGER,
  chargeable_weight   DECIMAL(10,2),
  commodity           VARCHAR(255),
  raw_pdf_url         VARCHAR(500)    NOT NULL,
  parse_status        VARCHAR(20)     NOT NULL DEFAULT 'pending'
                      CHECK (parse_status IN ('pending','success','partial','failed','manual')),
  parse_raw_text      TEXT,
  invoiced            BOOLEAN         NOT NULL DEFAULT FALSE,
  invoice_id          UUID,
  uploaded_by         BIGINT          NOT NULL,
  edited_by           BIGINT,
  edited_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_awbs_customer   FOREIGN KEY (customer_id)  REFERENCES customers(id),
  CONSTRAINT fk_awbs_uploaded   FOREIGN KEY (uploaded_by)  REFERENCES staff_accounts(id),
  CONSTRAINT fk_awbs_edited     FOREIGN KEY (edited_by)    REFERENCES staff_accounts(id)
);

-- Unique constraint: one AWB number per customer
CREATE UNIQUE INDEX IF NOT EXISTS uq_awbs_customer_awb ON awbs (customer_id, awb_number)
  WHERE awb_number IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_awbs_customer_invoiced ON awbs (customer_id, invoiced, parse_status);

-- 4. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number      VARCHAR(50)     NOT NULL UNIQUE,
  customer_id         BIGINT          NOT NULL,
  currency            VARCHAR(3)      NOT NULL DEFAULT 'IDR'
                      CHECK (currency IN ('IDR','USD','JPY')),
  subtotal            DECIMAL(15,2)   NOT NULL,
  total_pengurangan   DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  net_amount          DECIMAL(15,2)   NOT NULL,
  vat_enabled         BOOLEAN         NOT NULL DEFAULT FALSE,
  vat_amount          DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  total               DECIMAL(15,2)   NOT NULL,
  deposit_amount      DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  amount_due          DECIMAL(15,2)   NOT NULL,
  invoice_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  period              VARCHAR(100),
  payment_terms       VARCHAR(100)    DEFAULT 'CASH',
  city                VARCHAR(100)    DEFAULT 'Tangerang',
  bank_account        VARCHAR(20)     DEFAULT 'OCBC'
                      CHECK (bank_account IN ('OCBC','MANDIRI')),
  show_period         BOOLEAN         NOT NULL DEFAULT FALSE,
  show_payment_terms  BOOLEAN         NOT NULL DEFAULT TRUE,
  generated_by        BIGINT          NOT NULL,
  generated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  retain_until        DATE            NOT NULL,
  archived            BOOLEAN         NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_invoices_customer   FOREIGN KEY (customer_id)  REFERENCES customers(id),
  CONSTRAINT fk_invoices_generated  FOREIGN KEY (generated_by) REFERENCES staff_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_retain   ON invoices (retain_until);

-- 5. Add FK from awbs to invoices (deferred because invoices table must exist first)
DO $$
BEGIN
  ALTER TABLE awbs ADD CONSTRAINT fk_awbs_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_awbs_invoice_id ON awbs (invoice_id);

-- 6. Create invoice_deductions table
CREATE TABLE IF NOT EXISTS invoice_deductions (
  id            UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id    UUID            NOT NULL,
  description   VARCHAR(255)    NOT NULL,
  amount        DECIMAL(15,2)   NOT NULL,
  sort_order    INTEGER         NOT NULL DEFAULT 0,

  CONSTRAINT fk_deductions_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX IF NOT EXISTS idx_deductions_invoice ON invoice_deductions (invoice_id, sort_order);

-- 7. Create invoice_line_items table (snapshot storage)
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id          UUID            NOT NULL,
  awb_id              UUID,
  line_type           VARCHAR(10)     NOT NULL CHECK (line_type IN ('awb','service')),
  sort_order          INTEGER         NOT NULL DEFAULT 0,
  origin              CHAR(3),
  destination         CHAR(3),
  shipment_date       DATE,
  awb_number          VARCHAR(20),
  flight_number       VARCHAR(20),
  pieces              INTEGER,
  chargeable_weight   DECIMAL(10,2),
  description         VARCHAR(255),
  price_per_kg        DECIMAL(15,2),
  flat_amount         DECIMAL(15,2),
  line_total          DECIMAL(15,2)   NOT NULL,

  CONSTRAINT fk_line_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_line_items_awb     FOREIGN KEY (awb_id)     REFERENCES awbs(id)
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items (invoice_id, sort_order);

-- 8. Create audit_log table
CREATE TABLE IF NOT EXISTS invoice_audit_log (
  id            BIGSERIAL       PRIMARY KEY,
  action        VARCHAR(100)    NOT NULL,
  entity_type   VARCHAR(50)     NOT NULL,
  entity_id     VARCHAR(36)     NOT NULL,
  performed_by  BIGINT          NOT NULL,
  performed_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  metadata      JSONB,

  CONSTRAINT fk_audit_user FOREIGN KEY (performed_by) REFERENCES staff_accounts(id)
);

-- NOTE: Application DB user MUST NOT have DELETE or UPDATE on this table
CREATE INDEX IF NOT EXISTS idx_audit_entity ON invoice_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user   ON invoice_audit_log (performed_by);

-- 9. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id            BIGSERIAL       PRIMARY KEY,
  user_id       BIGINT          NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  message       TEXT            NOT NULL,
  link          VARCHAR(500),
  is_read       BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES staff_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- 10. Auto-update updated_at trigger for awbs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  CREATE TRIGGER update_awbs_updated_at
    BEFORE UPDATE ON awbs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
