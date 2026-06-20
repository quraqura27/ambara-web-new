import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShipmentEditUpdates,
  ShipmentEditFormError,
  parseShipmentEditForm,
} from "./edit.ts";

function validForm(overrides: Record<string, string> = {}) {
  const values = {
    cargoType: "general",
    chargeableWeight: "1.7",
    codAmount: "0",
    commodity: "General cargo",
    customerName: "Smoke Test Customer",
    customerReference: "REF-001",
    deliveryInstruction: "Call receiver",
    destination: "Jakarta Selatan",
    destinationCity: "Jakarta Selatan",
    goodsDescription: "Boxed goods",
    awbAirlineName: "Garuda Indonesia",
    flightLegsJson: JSON.stringify([
      { airlineName: "Garuda Indonesia", flightNumber: "GA820" },
    ]),
    mawb: "126-9360193",
    origin: "Jakarta",
    pieces: "1",
    postalCode: "12190",
    receiverAddress: "Jl Test 1",
    receiverName: "Receiver Name",
    receiverPhone: "080000000201",
    serviceType: "dtd",
    shipperAddress: "Origin address",
    shipperName: "Shipper Name",
    shipperPhone: "080000000001",
    title: "Editable shipment",
    weightKg: "1.5",
    ...overrides,
  };

  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

test("parses editable shipment fields", () => {
  const parsed = parseShipmentEditForm(validForm({ customerId: "42" }));

  assert.equal(parsed.customerId, 42);
  assert.equal(parsed.mawb, "126-93601933");
  assert.equal(parsed.awbAirlineName, "Garuda Indonesia");
  assert.equal(parsed.flightLegs[0]?.formattedNumber, "GA820");
  assert.equal(parsed.serviceType, "DTD");
  assert.equal(parsed.pieces, 1);
  assert.equal(parsed.weightKg, "1.5");
});

test("rejects missing receiver name", () => {
  assert.throws(
    () => parseShipmentEditForm(validForm({ receiverName: "" })),
    ShipmentEditFormError,
  );
});

test("rejects missing receiver address", () => {
  assert.throws(
    () => parseShipmentEditForm(validForm({ receiverAddress: "" })),
    ShipmentEditFormError,
  );
});

test("rejects missing commodity", () => {
  assert.throws(
    () => parseShipmentEditForm(validForm({ commodity: "" })),
    ShipmentEditFormError,
  );
});

test("rejects invalid pieces", () => {
  assert.throws(
    () => parseShipmentEditForm(validForm({ pieces: "0" })),
    ShipmentEditFormError,
  );
});

test("rejects invalid weight", () => {
  assert.throws(
    () => parseShipmentEditForm(validForm({ weightKg: "-1" })),
    ShipmentEditFormError,
  );
});

test("immutable submitted fields are ignored by edit parsing and update building", () => {
  const formData = validForm({
    ambaraParcelId: "AA26-PRIVATE-001",
    createdAt: "2000-01-01",
    createdBy: "someone",
    internalTrackingNo: "AA26-PRIVATE",
    status: "delivered",
    trackingNumber: "AA26-PRIVATE",
    vendorTrackingNumber: "VENDOR-PRIVATE",
  });
  const parsed = parseShipmentEditForm(formData);
  const updates = buildShipmentEditUpdates(parsed, 7, new Date("2026-06-15T00:00:00Z"));
  const serialized = JSON.stringify(updates);

  assert.equal("trackingNumber" in updates.shipment, false);
  assert.equal("internalTrackingNo" in updates.shipment, false);
  assert.equal("status" in updates.shipment, false);
  assert.equal("createdAt" in updates.shipment, false);
  assert.equal("createdBy" in updates.shipment, false);
  assert.equal("ambaraParcelId" in updates.parcel, false);
  assert.equal(serialized.includes("AA26-PRIVATE"), false);
  assert.equal(serialized.includes("VENDOR-PRIVATE"), false);
});

test("builds shipment and linked parcel updates without changing identifiers", () => {
  const parsed = parseShipmentEditForm(validForm({ receiverName: "Updated Receiver" }));
  const updatedAt = new Date("2026-06-15T00:00:00Z");
  const updates = buildShipmentEditUpdates(parsed, 7, updatedAt);

  assert.equal(updates.shipment.consigneeName, "Updated Receiver");
  assert.equal(updates.shipment.updatedByStaff, 7);
  assert.equal(updates.shipment.updatedAt, updatedAt);
  assert.equal(updates.parcel.receiverName, "Updated Receiver");
  assert.equal(updates.parcel.updatedAt, updatedAt);
});
