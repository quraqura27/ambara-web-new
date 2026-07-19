import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/016-flexible-invoice-charges.sql", import.meta.url),
  "utf8",
);
const runner = readFileSync(new URL("../../scripts/migrate.cjs", import.meta.url), "utf8");

test("flexible invoice migration is additive and preserves issued invoice formatting", () => {
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS format_version integer NOT NULL DEFAULT 1/);
  assert.match(migration, /WHERE coalesce\(status, 'sent'\) = 'draft'/);
  assert.match(migration, /WHEN line_type = 'awb' THEN 'per_kg'/);
  assert.match(migration, /ELSE 'flat'/);
  assert.match(migration, /SET reference = awb_number/);
  assert.match(migration, /billing_basis IN \('per_kg', 'flat'\)/);
});

test("migration runner verifies flexible invoice columns", () => {
  assert.match(runner, /name\.startsWith\("016-"\)/);
  assert.match(runner, /migration016Columns/);
  assert.match(runner, /\["invoices", "format_version"\]/);
  assert.match(runner, /\["invoice_line_items", "billing_basis"\]/);
  assert.match(runner, /\["invoice_line_items", "reference"\]/);
});
