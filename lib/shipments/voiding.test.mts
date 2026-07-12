import assert from "node:assert/strict";
import test from "node:test";

import {
  assessShipmentVoid,
  isShipmentVoidReason,
  shouldIncludeShipment,
} from "./voiding.ts";

const noRelations = {
  deliveryBatchLinks: 0,
  documentCount: 0,
  exportOrPrintEvents: 0,
  hasCustomer: false,
  invoiceLinks: 0,
  mawbLinks: 0,
  trackingEvents: 0,
};

test("admin and superadmin can void ordinary shipments", () => {
  assert.equal(assessShipmentVoid(noRelations, { role: "admin" }).allowed, true);
  assert.equal(assessShipmentVoid(noRelations, { role: "superadmin" }).allowed, true);
});

test("viewer, finance, and operations cannot void shipments", () => {
  assert.equal(assessShipmentVoid(noRelations, { role: "viewer" }).allowed, false);
  assert.equal(assessShipmentVoid(noRelations, { role: "finance" }).allowed, false);
  assert.equal(assessShipmentVoid(noRelations, { role: "operations" }).allowed, false);
});

test("invoice or MAWB links require a superadmin override", () => {
  const linked = { ...noRelations, invoiceLinks: 1, mawbLinks: 1 };
  const admin = assessShipmentVoid(linked, { role: "admin" });
  const superadmin = assessShipmentVoid(linked, { role: "superadmin" });

  assert.equal(admin.requiresElevatedOverride, true);
  assert.equal(admin.allowed, false);
  assert.equal(superadmin.allowed, true);
  assert.match(superadmin.warnings.join(" "), /invoice/i);
  assert.match(superadmin.warnings.join(" "), /MAWB/i);
});

test("void reason and list inclusion rules are explicit", () => {
  assert.equal(isShipmentVoidReason("duplicate_shipment"), true);
  assert.equal(isShipmentVoidReason(""), false);
  assert.equal(shouldIncludeShipment(null, false), true);
  assert.equal(shouldIncludeShipment(new Date(), false), false);
  assert.equal(shouldIncludeShipment(new Date(), true), true);
});
