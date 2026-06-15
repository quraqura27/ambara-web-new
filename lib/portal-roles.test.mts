import assert from "node:assert/strict";
import test from "node:test";

import {
  canEditShipmentDetails,
  canManageStaffAccounts,
  hasPortalRoleAtLeast,
  normalizePortalRole,
} from "./portal-roles.ts";

test("normalizes portal roles", () => {
  assert.equal(normalizePortalRole("super_admin"), "superadmin");
  assert.equal(normalizePortalRole("ops"), "operations");
  assert.equal(normalizePortalRole("administrator"), "admin");
  assert.equal(normalizePortalRole("unknown"), "viewer");
});

test("shipment detail editing is superadmin-only", () => {
  assert.equal(canEditShipmentDetails({ role: "superadmin" }), true);
  assert.equal(canEditShipmentDetails({ role: "admin" }), false);
  assert.equal(canEditShipmentDetails({ role: "operations" }), false);
  assert.equal(canEditShipmentDetails(null), false);
});

test("existing role hierarchy remains unchanged", () => {
  assert.equal(hasPortalRoleAtLeast({ role: "admin" }, "admin"), true);
  assert.equal(hasPortalRoleAtLeast({ role: "operations" }, "admin"), false);
  assert.equal(canManageStaffAccounts({ role: "superadmin" }), true);
  assert.equal(canManageStaffAccounts({ role: "admin" }), false);
});
