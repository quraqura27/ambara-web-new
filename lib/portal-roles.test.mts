import assert from "node:assert/strict";
import test from "node:test";

import {
  canEditShipmentDetails,
  canManageStaffAccounts,
  canManageInvoices,
  canManageShipmentStatus,
  canPrintShipmentDocuments,
  canRestoreShipment,
  canVoidShipment,
  hasPortalCapability,
  normalizePortalRole,
} from "./portal-roles.ts";

test("normalizes portal roles", () => {
  assert.equal(normalizePortalRole("super_admin"), "superadmin");
  assert.equal(normalizePortalRole("ops"), "operations");
  assert.equal(normalizePortalRole("administrator"), "admin");
  assert.equal(normalizePortalRole("unknown"), "viewer");
});

test("shipment void and restore capabilities are explicit", () => {
  assert.equal(canVoidShipment({ role: "superadmin" }), true);
  assert.equal(canVoidShipment({ role: "admin" }), true);
  assert.equal(canVoidShipment({ role: "operations" }), false);
  assert.equal(canVoidShipment({ role: "finance" }), false);
  assert.equal(canVoidShipment({ role: "viewer" }), false);
  assert.equal(canRestoreShipment({ role: "superadmin" }), true);
  assert.equal(canRestoreShipment({ role: "admin" }), false);
});

test("shipment detail editing is granted explicitly to operational staff", () => {
  assert.equal(canEditShipmentDetails({ role: "superadmin" }), true);
  assert.equal(canEditShipmentDetails({ role: "operations" }), true);
  assert.equal(canEditShipmentDetails({ role: "admin" }), true);
  assert.equal(canEditShipmentDetails({ role: "finance" }), false);
  assert.equal(canEditShipmentDetails({ role: "viewer" }), false);
  assert.equal(canEditShipmentDetails({ role: "unknown" }), false);
  assert.equal(canEditShipmentDetails(null), false);
});

test("capability matrix replaces role rank comparisons", () => {
  assert.equal(hasPortalCapability({ role: "admin" }, "shipment:export"), true);
  assert.equal(hasPortalCapability({ role: "operations" }, "shipment:export"), false);
  assert.equal(hasPortalCapability({ role: "finance" }, "shipment:edit"), false);
  assert.equal(hasPortalCapability({ role: "viewer" }, "shipment:view"), true);
  assert.equal(canManageStaffAccounts({ role: "superadmin" }), true);
  assert.equal(canManageStaffAccounts({ role: "admin" }), false);
  assert.equal(canManageShipmentStatus({ role: "operations" }), true);
  assert.equal(canManageShipmentStatus({ role: "viewer" }), false);
  assert.equal(canManageShipmentStatus({ role: "finance" }), false);
  assert.equal(canManageInvoices({ role: "finance" }), true);
  assert.equal(canManageInvoices({ role: "admin" }), false);
  assert.equal(canPrintShipmentDocuments({ role: "operations" }), true);
  assert.equal(canPrintShipmentDocuments({ role: "finance" }), false);
});
