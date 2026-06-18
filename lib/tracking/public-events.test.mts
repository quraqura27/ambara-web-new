import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCustomerVisibleTrackingEvent,
  isDuplicateCustomerVisibleEvent,
  normalizePublicTrackingInput,
} from "./public-events.ts";

test("normalizes public tracking lookup input with accidental leading comma", () => {
  assert.equal(normalizePublicTrackingInput(" ,aa26-29ct-cazz "), "AA26-29CT-CAZZ");
});

test("maps delivered to customer-safe public tracking text", () => {
  assert.deepEqual(buildCustomerVisibleTrackingEvent("delivered"), {
    label: "Delivered",
    publicDescription: "Shipment has been delivered successfully.",
    status: "delivered",
    statusCode: "DELIVERED",
  });
});

test("maps manual shipment creation to received-information public text", () => {
  assert.deepEqual(buildCustomerVisibleTrackingEvent("SHIPMENT_CREATED"), {
    label: "Shipment Information Received",
    publicDescription: "Shipment information has been received.",
    status: "pending",
    statusCode: "DRAFT",
  });
});

test("uses destination-port arrival wording for port services", () => {
  assert.deepEqual(buildCustomerVisibleTrackingEvent("arrived_destination", "DTP"), {
    label: "Arrived at Destination Port",
    publicDescription: "Shipment has arrived at the destination port.",
    status: "arrived_destination",
    statusCode: "ARRIVED_DESTINATION",
  });
});

test("marks repeated visible status event as duplicate", () => {
  const nextEvent = buildCustomerVisibleTrackingEvent("DELIVERED");

  assert.equal(
    isDuplicateCustomerVisibleEvent(
      {
        publicDescription: "Shipment has been delivered successfully.",
        status: "delivered",
        statusCode: "DELIVERED",
      },
      nextEvent,
    ),
    true,
  );
});

test("does not mark a new visible status as duplicate", () => {
  assert.equal(
    isDuplicateCustomerVisibleEvent(
      {
        publicDescription: "Shipment information has been received.",
        status: "pending",
        statusCode: "DRAFT",
      },
      buildCustomerVisibleTrackingEvent("OUT_FOR_DELIVERY"),
    ),
    false,
  );
});
