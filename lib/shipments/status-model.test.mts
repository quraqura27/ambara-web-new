import assert from "node:assert/strict";
import test from "node:test";

import {
  canTransitionShipmentStatus,
  getAllowedShipmentTransitions,
  getShipmentStatusDefinition,
  normalizeShipmentStatus,
} from "./status-model.ts";

test("normalizes portal and vendor status aliases", () => {
  assert.equal(normalizeShipmentStatus("HANDED_TO_DELIVERY_PARTNER"), "in_transit");
  assert.equal(normalizeShipmentStatus("departed"), "departed_origin");
  assert.equal(normalizeShipmentStatus("Delivery Issue"), "delivery_issue");
});

test("allows the normal received to processed progression", () => {
  assert.equal(canTransitionShipmentStatus("received", "processed"), true);
  assert.equal(canTransitionShipmentStatus("received", "delivered"), false);
});

test("terminal statuses expose no normal transitions", () => {
  assert.deepEqual(getAllowedShipmentTransitions("delivered"), []);
  assert.equal(getShipmentStatusDefinition("delivered").terminal, true);
});

test("port services finish when they arrive at the destination port", () => {
  assert.equal(
    getShipmentStatusDefinition("arrived_destination", "DTP").publicLabel,
    "Arrived at Destination Port",
  );
  assert.equal(getShipmentStatusDefinition("arrived_destination", "PTP").terminal, true);
  assert.deepEqual(getAllowedShipmentTransitions("arrived_destination", "DTP"), []);
  assert.equal(canTransitionShipmentStatus("arrived_destination", "out_for_delivery", "PTP"), false);
});

test("door services can continue into last-mile delivery", () => {
  assert.equal(canTransitionShipmentStatus("arrived_destination", "out_for_delivery", "DTD"), true);
  assert.equal(canTransitionShipmentStatus("arrived_destination", "out_for_delivery", "PTD"), true);
  assert.equal(getShipmentStatusDefinition("arrived_destination", "DTD").terminal, false);
});

test("keeps existing public delivery-issue wording for exception status", () => {
  const definition = getShipmentStatusDefinition("exception");
  assert.equal(definition.publicStatusCode, "DELIVERY_ISSUE");
  assert.equal(
    definition.publicDescription,
    "Delivery attempt could not be completed. Our team is monitoring the next update.",
  );
});
