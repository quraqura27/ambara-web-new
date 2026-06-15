import assert from "node:assert/strict";
import test from "node:test";

import publicTrackingPayload from "./public-tracking-payload.ts";

const { PublicTrackingPayloadError, sanitizeTrackingPayload } = publicTrackingPayload;

const forbiddenKeys = [
  "customer_name",
  "mawb",
  "shipper_name",
  "shipper_address",
  "shipper_phone",
  "consignee_name",
  "consignee_address",
  "consignee_phone",
  "internal_notes",
  "internal_tracking_no",
  "documents",
  "generation_status",
  "tracking_created_at",
  "updated_by",
  "internal_note",
  "created_by",
  "vendor_raw_status",
  "bulk_update_job_id",
  "error_message",
];

function collectKeys(value: unknown, keys = new Set<string>()) {
  if (!value || typeof value !== "object") {
    return keys;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }

  Object.entries(value).forEach(([key, child]) => {
    keys.add(key);
    collectKeys(child, keys);
  });

  return keys;
}

test("sanitizes payload and sorts events chronologically", () => {
  const result = sanitizeTrackingPayload({
    shipment: {
      tracking_number: "AA26-K6AR-997L",
      internal_tracking_no: "AA26-PRIVATE-ALIAS",
      status: "processed",
      origin: "Jakarta, Indonesia",
      destination: "Sorong, ID",
      customer_name: "Private customer",
      mawb: "999-00000000",
      shipper_address: "Private shipper address",
      shipper_phone: "+62 811-0000-0000",
      consignee_address: "Private consignee address",
      generation_status: "CREATED",
    },
    events: [
      {
        status: "processed",
        label: "Shipment processed at origin",
        description: "Cargo has been processed and prepared for onward movement.",
        location: "Jakarta, Indonesia",
        event_time: "2026-06-04T19:35:05.987Z",
        updated_by: "Bulk_Status_Updates row 2",
        internal_note: "Private vendor account message",
        created_by: 99,
        vendor_raw_status: "BAD_VENDOR_ERROR",
        bulk_update_job_id: 123,
        error_message: "Raw vendor exception",
      },
      {
        status: "pending",
        label: "Electronic information received",
        description: "Shipment information has been received and is awaiting physical handling.",
        location: "Jakarta, Indonesia",
        event_time: "2026-06-04T15:14:36.067Z",
      },
    ],
  });

  assert.equal(result.shipment.tracking_number, "AA26-K6AR-997L");
  assert.deepEqual(
    result.events.map((event) => event.label),
    ["Electronic information received", "Shipment processed at origin"],
  );

  const keys = collectKeys(result);
  forbiddenKeys.forEach((key) => assert.equal(keys.has(key), false, key));
});

test("treats explicit not-found payloads as invalid shipment data", () => {
  assert.throws(
    () => sanitizeTrackingPayload({ found: false, status: "not_found" }),
    PublicTrackingPayloadError,
  );
});

test("keeps missing or invalid event timestamps after dated events", () => {
  const result = sanitizeTrackingPayload({
    shipment: {
      tracking_number: "AA26-K6AR-997L",
    },
    events: [
      {
        label: "Undated event",
        event_time: "",
      },
      {
        label: "Dated event",
        event_time: "2026-06-04T15:14:36.067Z",
      },
    ],
  });

  assert.deepEqual(
    result.events.map((event) => event.label),
    ["Dated event", "Undated event"],
  );
});
