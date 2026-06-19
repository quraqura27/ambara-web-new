import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("public tracking runtime does not use Google Sheets fallback", () => {
  const route = read("app/api/track-shipment/route.ts");
  const publicTracking = read("lib/tracking/public-tracking.ts");

  assert.equal(route.includes("lib/google-sheets"), false);
  assert.equal(route.includes("GOOGLE_TRACKING_WEB_APP_URL"), false);
  assert.equal(publicTracking.includes("GOOGLE_TRACKING_WEB_APP_URL"), false);
  assert.equal(publicTracking.includes("fetch("), false);
});

test("public tracking only selects migration-independent database columns", () => {
  const publicTracking = read("lib/tracking/public-tracking.ts");

  assert.doesNotMatch(publicTracking, /\.select\(\)\s*\.from\(shipments\)/);
  assert.doesNotMatch(publicTracking, /\.select\(\)\s*\.from\(trackingEvents\)/);
});

test("internal sheet sync endpoint is disabled", () => {
  const route = read("app/api/internal/sync-shipment/route.ts");

  assert.match(route, /Google Sheets import has been disabled/);
  assert.equal(route.includes("upsertSheetShipmentToDatabase"), false);
  assert.equal(route.includes("parseSheetShipmentPayload"), false);
});

test("portal shipment actions do not call external tracking provider", () => {
  const actions = read("actions/shipments.ts");

  assert.equal(actions.includes("trackingProvider"), false);
  assert.equal(actions.includes("getTrackingInfo"), false);
});

test("shipment export remains database-only", () => {
  const exportDatabase = read("lib/shipment-export/database.ts");

  assert.equal(exportDatabase.includes("google-sheets"), false);
  assert.equal(exportDatabase.includes("GOOGLE_TRACKING_WEB_APP_URL"), false);
});
