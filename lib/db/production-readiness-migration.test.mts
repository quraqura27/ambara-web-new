import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/015-portal-production-readiness.sql", import.meta.url),
  "utf8",
);
const runner = readFileSync(new URL("../../scripts/migrate.cjs", import.meta.url), "utf8");

test("production-readiness migration is additive and version-backs existing documents", () => {
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS session_version/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS portal_login_attempts/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shipment_packages/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shipment_operational_tasks/);
  assert.match(migration, /row_number\(\) OVER/i);
  assert.match(migration, /documents_shipment_type_version_unique_idx/);
});

test("migration runner verifies the void and readiness migrations", () => {
  assert.match(runner, /name\.startsWith\("014-"\)/);
  assert.match(runner, /name\.startsWith\("015-"\)/);
  assert.match(runner, /migration015Columns/);
  assert.match(runner, /migration015Indexes/);
});
