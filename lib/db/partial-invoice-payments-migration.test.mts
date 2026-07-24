import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/017-invoice-partial-payments.sql", import.meta.url),
  "utf8",
);
const runner = readFileSync(new URL("../../scripts/migrate.cjs", import.meta.url), "utf8");

test("partial-payment migration is additive, repeatable, and backfills legacy settlements", () => {
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS invoice_payments/i);
  assert.match(migration, /amount numeric\(18, 2\) NOT NULL/i);
  assert.match(migration, /CONSTRAINT invoice_payments_amount_check CHECK \(amount > 0\)/i);
  assert.match(migration, /source IN \('portal', 'legacy_backfill'\)/i);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_legacy_invoice_unique_idx/i);
  assert.match(migration, /WHERE \(invoice\.status = 'paid' OR invoice\.paid_at IS NOT NULL\)/i);
  assert.match(migration, /NOT EXISTS \([\s\S]*existing_payment\.source = 'legacy_backfill'/i);
  assert.match(migration, /ON CONFLICT DO NOTHING/i);
  assert.match(migration, /DROP TRIGGER IF EXISTS invoice_payments_enforce_ledger/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION enforce_invoice_payment_ledger/i);
});

test("payment ledger is append-only and retains immutable void audit metadata", () => {
  assert.match(migration, /Invoice payments are append-only\. Void the payment instead\./);
  assert.match(migration, /Invoice payment entries cannot be edited\. Void and re-enter the payment\./);
  assert.match(migration, /voided_at IS NOT NULL AND voided_by IS NOT NULL AND btrim\(void_reason\) <> ''/i);
  assert.match(migration, /BEFORE INSERT OR UPDATE OR DELETE ON invoice_payments/i);
});

test("database serialization prevents concurrent overpayment and invalid payment states", () => {
  assert.match(migration, /FROM invoices invoice[\s\S]*FOR UPDATE;/i);
  assert.match(migration, /invoice_status <> 'sent'/i);
  assert.match(migration, /NEW\.payment_date IS NULL OR NEW\.payment_date > current_date/i);
  assert.match(migration, /NEW\.reference IS NULL OR btrim\(NEW\.reference\) = ''/i);
  assert.match(migration, /round\(active_total \+ NEW\.amount, 2\) > round\(invoice_total, 2\)/i);
  assert.match(migration, /Payment exceeds the outstanding invoice balance\./);
});

test("active payments derive invoice settlement state and block invoice voiding", () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION sync_invoice_payment_state/i);
  assert.match(migration, /WHEN coalesce\(invoice\.net_payable, 0\) > 0[\s\S]*THEN 'paid'[\s\S]*ELSE 'sent'/i);
  assert.match(migration, /THEN settlement_date::timestamp/i);
  assert.match(migration, /THEN settlement_reference/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION prevent_invoice_void_with_active_payments/i);
  assert.match(migration, /NEW\.status = 'voided'[\s\S]*payment\.voided_at IS NULL/i);
});

test("migration runner verifies payment-ledger columns and indexes", () => {
  assert.match(runner, /name\.startsWith\("017-"\)/);
  assert.match(runner, /migration017Columns/);
  assert.match(runner, /migration017Tables/);
  assert.match(runner, /migration017Indexes/);
  assert.match(runner, /\["invoice_payments", "payment_date"\]/);
  assert.match(runner, /"invoice_payments_active_invoice_idx"/);
});
