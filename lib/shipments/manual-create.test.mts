import assert from "node:assert/strict";
import test from "node:test";

import {
  ManualShipmentFormError,
  parseManualShipmentForm,
} from "./manual-create.ts";

function validForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    customerName: "Smoke Test Customer",
    customerReference: "SMOKE-001",
    mawb: "123-45678901",
    serviceType: "DTD",
    shipmentDate: "2026-06-15",
    origin: "Jakarta",
    destination: "Jakarta Selatan",
    status: "pending",
    shipperName: "Ambara QA",
    shipperPhone: "080000000001",
    shipperAddress: "Origin address",
    receiverName: "Single Smoke Receiver",
    receiverPhone: "080000000201",
    receiverAddress: "Jl Single Smoke Test 1",
    destinationCity: "Jakarta Selatan",
    postalCode: "12190",
    commodity: "General cargo",
    goodsDescription: "Carton goods",
    pieces: "1",
    weightKg: "1.5",
    chargeableWeight: "2",
    cargoType: "general",
    deliveryInstruction: "Single test shipment only",
    codAmount: "0",
    internalNote: "Internal only",
    title: "Manual smoke shipment",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

test("parses complete manual shipment form data", () => {
  const parsed = parseManualShipmentForm(validForm({ customerId: "42" }));

  assert.equal(parsed.customerName, "Smoke Test Customer");
  assert.equal(parsed.mawb, "123-45678901");
  assert.equal(parsed.serviceType, "DTD");
  assert.equal(parsed.receiverName, "Single Smoke Receiver");
  assert.equal(parsed.receiverAddress, "Jl Single Smoke Test 1");
  assert.equal(parsed.commodity, "General cargo");
  assert.equal(parsed.pieces, 1);
  assert.equal(parsed.weightKg, "1.5");
  assert.equal(parsed.chargeableWeight, "2");
  assert.equal(parsed.customerId, 42);
  assert.equal(parsed.status, "pending");
  assert.equal(parsed.trackingNumberInput, null);
});

test("defaults title and status for manual shipment form", () => {
  const formData = validForm({ title: "", status: "unsupported" });
  const parsed = parseManualShipmentForm(formData);

  assert.equal(parsed.title, "Smoke Test Customer Jakarta to Jakarta Selatan");
  assert.equal(parsed.status, "pending");
});

test("rejects missing receiver name", () => {
  assert.throws(
    () => parseManualShipmentForm(validForm({ receiverName: "" })),
    /Receiver name is required\./,
  );
});

test("rejects missing receiver address", () => {
  assert.throws(
    () => parseManualShipmentForm(validForm({ receiverAddress: "" })),
    /Receiver address is required\./,
  );
});

test("rejects missing commodity", () => {
  assert.throws(
    () => parseManualShipmentForm(validForm({ commodity: "" })),
    /Commodity is required\./,
  );
});

test("rejects invalid pieces", () => {
  assert.throws(
    () => parseManualShipmentForm(validForm({ pieces: "0" })),
    ManualShipmentFormError,
  );
});

test("rejects invalid weight", () => {
  assert.throws(
    () => parseManualShipmentForm(validForm({ weightKg: "-1" })),
    /Gross weight must be a positive number\./,
  );
});

test("rejects missing service type", () => {
  assert.throws(
    () => parseManualShipmentForm(validForm({ serviceType: "" })),
    /Service type is required\./,
  );
});
