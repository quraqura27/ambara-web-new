import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("shipment edit action is server-side superadmin gated", () => {
  const actions = read("actions/shipments.ts");

  assert.match(actions, /export async function updateShipmentDetails/);
  assert.match(actions, /canEditShipmentDetails\(user\)/);
  assert.match(actions, /Superadmin access is required to edit shipment details/);
});

test("shipment edit action does not mutate tracking history or immutable identifiers", () => {
  const actions = read("actions/shipments.ts");
  const editAction = actions.slice(actions.indexOf("export async function updateShipmentDetails"));
  const beforeNextAction = editAction.slice(0, editAction.indexOf("export async function getShipments"));

  assert.equal(beforeNextAction.includes("trackingEvents"), false);
  assert.equal(beforeNextAction.includes("trackingUpdates"), false);
  assert.equal(beforeNextAction.includes("createCustomerVisibleTrackingEvent"), false);
});

test("shipment edit route blocks non-superadmin before loading editable data", () => {
  const editPage = read("app/(portal)/shipments/[number]/edit/page.tsx");

  assert.match(editPage, /requirePortalUser\(\)/);
  assert.match(editPage, /canEditShipmentDetails\(user\)/);
  assert.match(editPage, /notFound\(\)/);
});

test("shipment detail only renders edit link for users allowed to edit", () => {
  const detailPage = read("app/(portal)/shipments/[number]/page.tsx");

  assert.match(detailPage, /canEditShipmentDetails\(user\)/);
  assert.match(detailPage, /Edit Shipment/);
  assert.match(detailPage, /\/edit/);
});
