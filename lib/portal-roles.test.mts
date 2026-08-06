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
  isAssignableStaffRole,
  normalizePortalRole,
} from "./portal-roles.ts";

test("normalizes portal roles", () => {
  assert.equal(normalizePortalRole("super_admin"), "superadmin");
  assert.equal(normalizePortalRole("ops"), "operations");
  assert.equal(normalizePortalRole("administrator"), "admin");
  assert.equal(normalizePortalRole("Sales Manager"), "sales_manager");
  assert.equal(normalizePortalRole("salesperson"), "sales");
  assert.equal(normalizePortalRole("cs"), "customer_service");
  assert.equal(normalizePortalRole("director"), "director");
  assert.equal(normalizePortalRole("unknown"), "viewer");
});

test("fixed CRM staff roles are assignable without changing legacy roles", () => {
  for (const role of ["director", "sales_manager", "sales", "customer_service", "operations", "finance", "admin", "viewer", "superadmin"] as const) {
    assert.equal(isAssignableStaffRole(normalizePortalRole(role)), true);
  }
});

test("CRM capability matrix defaults to least privilege", () => {
  assert.equal(hasPortalCapability({ role: "sales" }, "crm:view"), true);
  assert.equal(hasPortalCapability({ role: "sales" }, "crm:manage"), true);
  assert.equal(hasPortalCapability({ role: "sales" }, "crm:all:view"), false);
  assert.equal(hasPortalCapability({ role: "sales" }, "crm:cost:view"), false);
  assert.equal(hasPortalCapability({ role: "sales" }, "crm:margin:view"), false);
  assert.equal(hasPortalCapability({ role: "sales_manager" }, "crm:team:view"), true);
  assert.equal(hasPortalCapability({ role: "sales_manager" }, "crm:cost:view"), true);
  assert.equal(hasPortalCapability({ role: "director" }, "crm:all:view"), true);
  assert.equal(hasPortalCapability({ role: "director" }, "crm:compliance:view"), true);
  assert.equal(hasPortalCapability({ role: "sales" }, "crm:compliance:view"), false);
  assert.equal(hasPortalCapability({ role: "finance" }, "crm:view"), false);
  assert.equal(hasPortalCapability({ role: "finance" }, "crm:cost:view"), false);
  assert.equal(hasPortalCapability({ role: "finance" }, "crm:manage"), false);
  assert.equal(hasPortalCapability({ role: "admin" }, "crm:view"), false);
  assert.equal(hasPortalCapability({ role: "customer_service" }, "crm:all:view"), false);
  assert.equal(hasPortalCapability({ role: "customer_service" }, "crm:stage:manage"), false);
  assert.equal(hasPortalCapability({ role: "operations" }, "crm:view"), false);
  assert.equal(hasPortalCapability({ role: "viewer" }, "crm:view"), false);
  assert.equal(hasPortalCapability({ role: "unknown" }, "crm:view"), false);
  assert.equal(hasPortalCapability(null, "crm:view"), false);
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
