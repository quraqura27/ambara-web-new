import assert from "node:assert/strict";
import test from "node:test";

import { getSheetsSyncAuthError } from "./auth.ts";
import { parseSheetShipmentPayload } from "./payload.ts";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    internal_tracking_no: "AA26-TEST-0001",
    mawb: "999-00000000",
    title: "Shipment 999-00000000",
    current_status: "processed",
    service_type: "airport_to_airport",
    origin: "Jakarta",
    origin_iata: "cgk",
    destination: "Singapore",
    destination_iata: "sin",
    customer_name: "MARS Express",
    shipper_name: "Private shipper",
    shipper_address: "Private shipper address",
    shipper_phone: "+62 811-0000-0000",
    consignee_name: "Private consignee",
    consignee_address: "Private consignee address",
    consignee_phone: "+65 8000 0000",
    goods_description: "Machine parts",
    cargo_type: "general",
    commodity: "General cargo",
    total_pcs: "2",
    weight_kg: "12.5",
    chargeable_weight: "13",
    created_at: "2026-06-04T15:14:36.067Z",
    updated_at: "2026-06-05T02:00:00.000Z",
    ...overrides,
  };
}

test("rejects missing and invalid sync authorization", () => {
  assert.equal(
    getSheetsSyncAuthError(new Headers(), "test-secret")?.code,
    "SYNC_AUTH_MISSING",
  );
  assert.equal(
    getSheetsSyncAuthError(new Headers({ authorization: "Bearer wrong" }), "test-secret")
      ?.code,
    "SYNC_AUTH_INVALID",
  );
  assert.equal(
    getSheetsSyncAuthError(
      new Headers({ "x-ambara-sync-secret": "test-secret" }),
      "test-secret",
    ),
    null,
  );
});

test("maps valid Sheet shipment payload to database upsert values", () => {
  const parsed = parseSheetShipmentPayload(validPayload(), {
    now: new Date("2026-06-05T03:00:00.000Z"),
  });

  assert.equal(parsed.trackingNumber, "AA26-TEST-0001");
  assert.equal(parsed.values.internalTrackingNo, "AA26-TEST-0001");
  assert.equal(parsed.values.trackingNumber, "AA26-TEST-0001");
  assert.equal(parsed.values.mawb, "999-00000000");
  assert.equal(parsed.values.shipperPhone, "+62 811-0000-0000");
  assert.equal(parsed.values.shipperAddress, "Private shipper address");
  assert.equal(parsed.values.consigneeAddress, "Private consignee address");
  assert.equal(parsed.values.totalPcs, 2);
  assert.equal(parsed.values.weightKg, "12.5");
  assert.equal(parsed.values.originIata, "CGK");
  assert.equal(parsed.values.destinationIata, "SIN");
});

test("same MAWB with different internal tracking numbers maps to distinct shipments", () => {
  const first = parseSheetShipmentPayload(
    validPayload({
      internal_tracking_no: "AA26-TEST-0001",
      mawb: "999-00000000",
    }),
  );
  const second = parseSheetShipmentPayload(
    validPayload({
      internal_tracking_no: "AA26-TEST-0002",
      mawb: "999-00000000",
    }),
  );

  assert.equal(first.values.trackingNumber, "AA26-TEST-0001");
  assert.equal(second.values.trackingNumber, "AA26-TEST-0002");
  assert.equal(first.values.mawb, "999-00000000");
  assert.equal(second.values.mawb, "999-00000000");
  assert.notEqual(first.values.trackingNumber, second.values.trackingNumber);
});

test("rejects invalid payload shape and unsupported fields", () => {
  assert.throws(
    () => parseSheetShipmentPayload({ ...validPayload(), consignee_tax_id: "PRIVATE" }),
    /unsupported field/,
  );
  assert.throws(
    () => parseSheetShipmentPayload(validPayload({ internal_tracking_no: "" })),
    /Missing required field/,
  );
  assert.throws(
    () => parseSheetShipmentPayload(validPayload({ total_pcs: "1.5" })),
    /Invalid integer field/,
  );
});

test("same internal tracking number upserts without duplicate in memory", () => {
  const rows = new Map<string, ReturnType<typeof parseSheetShipmentPayload>["values"]>();

  function sync(payload: Record<string, unknown>) {
    const parsed = parseSheetShipmentPayload(payload);
    const action = rows.has(parsed.values.internalTrackingNo) ? "updated" : "created";
    rows.set(parsed.values.internalTrackingNo, parsed.values);
    return action;
  }

  assert.equal(sync(validPayload()), "created");
  assert.equal(
    sync(validPayload({ title: "Updated shipment", chargeable_weight: "14" })),
    "updated",
  );
  assert.equal(rows.size, 1);
  assert.equal(rows.get("AA26-TEST-0001")?.title, "Updated shipment");
  assert.equal(rows.get("AA26-TEST-0001")?.chargeableWeight, "14");
  assert.equal(rows.get("AA26-TEST-0001")?.trackingNumber, "AA26-TEST-0001");
  assert.equal(rows.get("AA26-TEST-0001")?.mawb, "999-00000000");
});
