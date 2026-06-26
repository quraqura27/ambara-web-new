import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMawbShipmentCopyUpdates,
  buildMawbTemplateValues,
  buildOtherChargesText,
  calculateMawbCharges,
  canOverwriteShipmentFromMawb,
  canUseMawbWorkflow,
  defaultMawbChargeLines,
  mawbPrintCopies,
  MawbFormError,
  normalizeMawbNumber,
  parseMawbForm,
} from "./core.ts";

function validForm(overrides: Record<string, string> = {}) {
  const values = {
    actionMode: "create_shipment",
    agentName: "PT PLI",
    chargeableWeight: "12",
    commodity: "General cargo",
    consigneeAddress: "Consignee address",
    consigneeName: "Consignee Name",
    currency: "IDR",
    declaredValueForCarriage: "NVD",
    declaredValueForCustoms: "NCV",
    departureAirport: "JAKARTA",
    destinationAirport: "MEXICO CITY",
    destinationIata: "MEX",
    executedPlace: "CGK",
    flightNumber: "GA123",
    goodsDescription: "Boxed goods",
    grossWeight: "10",
    idempotencyKey: "mawb-test-key",
    insuranceAmount: "NIL",
    mawbNumber: "126-91929552",
    originIata: "CGK",
    pieces: "3",
    rate: "1000",
    serviceType: "PTP",
    shipmentContactPhone: "080000000001",
    shipmentCustomerId: "42",
    shipmentCustomerName: "Customer Name",
    shipperAddress: "Shipper address",
    shipperName: "Shipper Name",
    ...overrides,
  };
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  defaultMawbChargeLines.forEach((line) => {
    formData.append("chargeCode", line.code);
    formData.append("chargeCurrency", line.currency);
    formData.append("chargeAmount", line.amount);
    formData.append("chargeBasis", line.basis);
  });
  return formData;
}

test("normalizes MAWB number and recognizes known airline prefixes", () => {
  assert.deepEqual(normalizeMawbNumber("126-91929552"), {
    awbSerial: "91929552",
    code: "GA",
    mawbNumber: "126-91929552",
    name: "GARUDA INDONESIA",
    prefix: "126",
  });
  assert.equal(normalizeMawbNumber("999-91929552"), null);
});

test("blocks save when MAWB prefix is unknown", () => {
  assert.throws(
    () => parseMawbForm(validForm({ mawbNumber: "999-91929552" })),
    MawbFormError,
  );
});

test("calculates other charges from editable line items", () => {
  const result = calculateMawbCharges({
    chargeableWeight: "12",
    grossWeight: "10",
    otherChargeLines: defaultMawbChargeLines,
    rate: "1000",
  });

  assert.equal(result.weightCharge, 12000);
  assert.equal(result.otherChargesTotal, 55500 + 10 * 84 + 10 * 1887 + 10 * 533);
  assert.equal(result.totalPrepaid, 12000 + result.otherChargesTotal);
});

test("builds text-box charge rows from editable lines", () => {
  assert.equal(
    buildOtherChargesText(defaultMawbChargeLines),
    "AWC IDR 55.500\nZB IDR 84\nMYC IDR 1.887\nFCC IDR 533",
  );
});

test("builds the 10-copy print model and template totals", () => {
  const parsed = parseMawbForm(validForm());
  const values = buildMawbTemplateValues(parsed);

  assert.equal(mawbPrintCopies.length, 10);
  assert.deepEqual(mawbPrintCopies.map((copy) => copy.sheetName), [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
  ]);
  assert.equal(values.A46, "80540");
  assert.equal(values.A50, "92540");
});

test("defaults airport fields from IATA entries and maps onward routing cells", () => {
  const parsed = parseMawbForm(validForm({
    departureAirport: "",
    destinationAirport: "",
    destinationIata: "TPE",
    routingBy1: "ak",
    routingTo1: "mle",
  }));
  const values = buildMawbTemplateValues(parsed);

  assert.equal(parsed.departureAirport, "CGK");
  assert.equal(parsed.destinationAirport, "TPE");
  assert.equal(values.A20, "TPE");
  assert.equal(values.A23, "TPE");
  assert.equal(values.V20, "to\n\nMLE");
  assert.equal(values.Y20, "by\n\nAK");
  assert.equal(values.AB20, "to");
  assert.equal(values.AE20, "by");
});

test("create-shipment mode requires an existing customer id", () => {
  assert.throws(
    () => parseMawbForm(validForm({ shipmentCustomerId: "" })),
    MawbFormError,
  );
});

test("blank-fill copy rules do not overwrite existing shipment fields for operations", () => {
  const parsed = parseMawbForm(validForm());
  const updates = buildMawbShipmentCopyUpdates({
    mawb: parsed,
    target: {
      chargeableWeight: null,
      destination: "Existing destination",
      mawb: "",
      shipperName: "Existing shipper",
      weightKg: null,
    },
    user: { role: "operations" },
    overwriteRequested: true,
    updatedByStaff: 7,
  });

  assert.equal(updates.mawb, "126-91929552");
  assert.equal(updates.weightKg, "10");
  assert.equal(updates.chargeableWeight, "12");
  assert.equal("destination" in updates, false);
  assert.equal("shipperName" in updates, false);
  assert.equal(updates.updatedByStaff, 7);
});

test("superadmin can overwrite safe shipment fields when requested", () => {
  const parsed = parseMawbForm(validForm());
  const updates = buildMawbShipmentCopyUpdates({
    mawb: parsed,
    target: {
      destination: "Existing destination",
      shipperName: "Existing shipper",
    },
    user: { role: "superadmin" },
    overwriteRequested: true,
  });

  assert.equal(updates.destination, "MEXICO CITY");
  assert.equal(updates.shipperName, "Shipper Name");
});

test("MAWB role gates allow operations admin superadmin and block finance viewer", () => {
  assert.equal(canUseMawbWorkflow({ role: "operations" }), true);
  assert.equal(canUseMawbWorkflow({ role: "admin" }), true);
  assert.equal(canUseMawbWorkflow({ role: "superadmin" }), true);
  assert.equal(canUseMawbWorkflow({ role: "finance" }), false);
  assert.equal(canUseMawbWorkflow({ role: "viewer" }), false);
  assert.equal(canOverwriteShipmentFromMawb({ role: "operations" }), false);
  assert.equal(canOverwriteShipmentFromMawb({ role: "superadmin" }), true);
});
