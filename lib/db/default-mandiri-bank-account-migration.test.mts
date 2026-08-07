import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/019-default-mandiri-invoice-bank-account.sql", import.meta.url),
  "utf8",
);

test("default Mandiri migration changes only the default for future invoices", () => {
  assert.doesNotMatch(migration, /\b(?:DELETE|DROP|TRUNCATE|UPDATE)\b/i);
  assert.match(migration, /ALTER COLUMN bank_account SET DEFAULT 'MANDIRI'/i);
});
