import assert from "node:assert/strict";
import test from "node:test";

import {
  getShipmentServiceDefinition,
  isDoorDeliveryService,
  normalizeShipmentService,
} from "./service-model.ts";

test("normalizes the four supported shipment services", () => {
  assert.equal(normalizeShipmentService(" dtd "), "DTD");
  assert.equal(normalizeShipmentService("PTP"), "PTP");
  assert.equal(normalizeShipmentService("express"), null);
});

test("only DTD and PTD require destination door delivery", () => {
  assert.equal(isDoorDeliveryService("DTD"), true);
  assert.equal(isDoorDeliveryService("PTD"), true);
  assert.equal(isDoorDeliveryService("DTP"), false);
  assert.equal(isDoorDeliveryService("PTP"), false);
});

test("port services terminate at arrived destination", () => {
  assert.equal(getShipmentServiceDefinition("DTP")?.terminalStatus, "arrived_destination");
  assert.equal(getShipmentServiceDefinition("PTP")?.arrivalPublicLabel, "Arrived at Destination Port");
  assert.equal(getShipmentServiceDefinition("DTD")?.terminalStatus, "delivered");
});
