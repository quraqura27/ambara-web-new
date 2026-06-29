import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMawbShipmentCopyUpdates,
  buildMawbTemplateValues,
  buildOtherChargesText,
  calculateMawbCharges,
  canOverwriteShipmentFromMawb,
  canUseMawbWorkflow,
  createBlankMawbChargeLine,
  mawbPrintCopies,
  MawbFormError,
  type MawbChargeLine,
  normalizeMawbNumber,
  parseMawbForm,
  parseMawbChargeLines,
  resolveMawbAirportDisplay,
} from "./core.ts";

const sampleChargeLines: MawbChargeLine[] = [
  { amount: "55500", basis: "fixed", code: "AWC", currency: "IDR" },
  { amount: "84", basis: "per_kg", code: "ZB", currency: "IDR" },
  { amount: "1887", basis: "per_kg", code: "MYC", currency: "IDR" },
  { amount: "533", basis: "per_kg", code: "FCC", currency: "IDR" },
];

function validForm(overrides: Record<string, string> = {}, chargeLines = sampleChargeLines) {
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
  chargeLines.forEach((line) => {
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
    name: "Garuda Indonesia",
    prefix: "126",
  });
  assert.deepEqual(normalizeMawbNumber("999-91929552"), {
    awbSerial: "91929552",
    code: "CA",
    mawbNumber: "999-91929552",
    name: "Air China",
    prefix: "999",
  });
  assert.equal(normalizeMawbNumber("000-91929552"), null);
});

test("MAWB normalization uses airline lookup without rejecting entered check digits", () => {
  assert.deepEqual(normalizeMawbNumber("126-9360193"), {
    awbSerial: "93601933",
    code: "GA",
    mawbNumber: "126-93601933",
    name: "Garuda Indonesia",
    prefix: "126",
  });
  assert.deepEqual(normalizeMawbNumber("126-93601939"), {
    awbSerial: "93601939",
    code: "GA",
    mawbNumber: "126-93601939",
    name: "Garuda Indonesia",
    prefix: "126",
  });
});

test("blocks save when MAWB prefix is unknown", () => {
  assert.throws(
    () => parseMawbForm(validForm({ mawbNumber: "000-91929552" })),
    MawbFormError,
  );
});

test("requires a real manual surcharge line", () => {
  assert.throws(
    () => parseMawbForm(validForm({}, [createBlankMawbChargeLine()])),
    (error) =>
      error instanceof MawbFormError &&
      error.fieldErrors.chargeCode === "Add at least one other-charge line item.",
  );
});

test("requires surcharge amount when code is entered", () => {
  const fieldErrors: Record<string, string> = {};
  const formData = new FormData();
  formData.append("chargeCode", "AWC");
  formData.append("chargeCurrency", "IDR");
  formData.append("chargeAmount", "");
  formData.append("chargeBasis", "fixed");

  assert.deepEqual(parseMawbChargeLines(formData, fieldErrors), [
    { amount: "", basis: "fixed", code: "AWC", currency: "IDR" },
  ]);
  assert.equal(fieldErrors.chargeAmount, "Each charge line needs an amount.");
});

test("allows blank surcharge scaffolding when linking to an existing MAWB", () => {
  const fieldErrors: Record<string, string> = {};
  const formData = new FormData();
  const blankLine = createBlankMawbChargeLine();
  formData.append("chargeCode", blankLine.code);
  formData.append("chargeCurrency", blankLine.currency);
  formData.append("chargeAmount", blankLine.amount);
  formData.append("chargeBasis", blankLine.basis);

  assert.deepEqual(parseMawbChargeLines(formData, fieldErrors, { requireAtLeastOne: false }), []);
  assert.deepEqual(fieldErrors, {});
});

test("calculates other charges from editable line items", () => {
  const result = calculateMawbCharges({
    chargeableWeight: "12",
    grossWeight: "10",
    otherChargeLines: sampleChargeLines,
    rate: "1000",
  });

  assert.equal(result.weightCharge, 12000);
  assert.equal(result.otherChargesTotal, 55500 + 10 * 84 + 10 * 1887 + 10 * 533);
  assert.equal(result.totalPrepaid, 12000 + result.otherChargesTotal);
});

test("builds text-box charge rows from editable lines", () => {
  assert.equal(
    buildOtherChargesText(sampleChargeLines),
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
  assert.equal(values.AN2, "Garuda Indonesia");
  assert.equal(values.A46, "80540");
  assert.equal(values.A50, "92540");
});

test("defaults airport fields from IATA entries and maps onward routing cells", () => {
  const parsed = parseMawbForm(validForm({
    departureAirport: "",
    destinationAirport: "",
    originIata: "KUL",
    destinationIata: "TPE",
    routingBy1: "ak",
    routingTo1: "mle",
  }));
  const values = buildMawbTemplateValues(parsed);

  assert.equal(parsed.departureAirport, "Kuala Lumpur International Airport");
  assert.equal(parsed.destinationAirport, "Taiwan");
  assert.equal(resolveMawbAirportDisplay("DMK", "destination"), "Bangkok");
  assert.equal(resolveMawbAirportDisplay("XYZ", "destination"), null);
  assert.equal(values.A20, "TPE");
  assert.equal(values.A23, "Taiwan");
  assert.equal(values.V20, "to\n\nMLE");
  assert.equal(values.Y20, "by\n\nAK");
  assert.equal(values.AB20, "to");
  assert.equal(values.AE20, "by");
});

test("unknown destination IATA requires a manual destination airport display", () => {
  assert.throws(
    () => parseMawbForm(validForm({ destinationAirport: "", destinationIata: "ZZZ" })),
    MawbFormError,
  );

  const parsed = parseMawbForm(
    validForm({ destinationAirport: "Manual Destination", destinationIata: "ZZZ" }),
  );
  assert.equal(parsed.destinationAirport, "Manual Destination");
});

test("create-shipment mode requires existing or new customer data", () => {
  assert.throws(
    () => parseMawbForm(validForm({ shipmentCustomerId: "" })),
    MawbFormError,
  );
  assert.equal(
    parseMawbForm(validForm({ shipmentContactPhone: "", shipmentCustomerId: "42" })).shipmentContactPhone,
    null,
  );
  const parsed = parseMawbForm(validForm({
    newCustomerCompanyName: "New Customer Co",
    shipmentContactPhone: "",
    shipmentCustomerId: "",
  }));
  assert.equal(parsed.newCustomerCompanyName, "New Customer Co");
  assert.equal(parsed.shipmentContactPhone, null);
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
