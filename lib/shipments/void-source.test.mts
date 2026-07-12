import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("server-side void action enforces permission, reason, safeguards, and audit", () => {
  const action = read("actions/shipment-void.ts");
  assert.match(action, /canVoidShipment\(user\)/);
  assert.match(action, /isShipmentVoidReason\(reason\)/);
  assert.match(action, /requiresElevatedOverride/);
  assert.match(action, /confirmTrackingNumber/);
  assert.match(action, /shipment_voided/);
  assert.match(action, /voided_at is null/);
});

test("voided shipments are excluded by default and hard delete stays disabled", () => {
  const shipmentActions = read("actions/shipments.ts");
  const dispatcher = read("server/legacy-api/lib/dispatcher.js");
  const accessPolicy = read("server/legacy-api/lib/access-policy.js");
  assert.match(shipmentActions, /isNull\(shipments\.voidedAt\)/);
  assert.match(shipmentActions, /includeVoided/);
  assert.doesNotMatch(dispatcher, /handlers\/shipments/);
  assert.match(accessPolicy, /'shipments'/);
  assert.match(accessPolicy, /legacy staff API is retired/i);
});

test("migration preserves required shipment void audit fields", () => {
  const migration = read("migrations/014-shipment-voids.sql");
  ["voided_at", "voided_by", "void_reason", "void_note", "previous_status"].forEach((field) => {
    assert.match(migration, new RegExp(field));
  });
});

test("local lifecycle preview cannot be enabled in production", () => {
  const preview = read("app/(portal)/shipments/void-preview/page.tsx");
  assert.match(preview, /process\.env\.NODE_ENV === "production"/);
  assert.match(preview, /notFound\(\)/);
  assert.match(preview, /previewMode/);
});
