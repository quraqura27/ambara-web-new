import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateVolumetricWeightKg,
  normalizeCargoRisks,
  parseShipmentPackages,
  parseWibDateTime,
} from "./readiness.ts";

test("calculates air-freight volumetric weight with the 6000 divisor", () => {
  assert.equal(calculateVolumetricWeightKg({ lengthCm: 80, widthCm: 70, heightCm: 60, pieces: 2 }), 112);
});

test("package parsing rejects invalid dimensions and normalizes numbering", () => {
  const rows = parseShipmentPackages(JSON.stringify([{ pieces: 2, lengthCm: 10, widthCm: 20, heightCm: 30, grossWeightKg: 4 }]));
  assert.equal(rows[0]?.packageNumber, 1);
  assert.throws(() => parseShipmentPackages(JSON.stringify([{ pieces: 1, lengthCm: 0, widthCm: 20, heightCm: 30 }])), /positive number/);
});

test("cargo risks are allowlisted and de-duplicated", () => {
  assert.deepEqual(normalizeCargoRisks(["battery", "battery", "private_note"]), ["battery"]);
});

test("WIB local inputs are interpreted with a Jakarta offset", () => {
  assert.equal(parseWibDateTime("2026-07-12T15:30")?.toISOString(), "2026-07-12T08:30:00.000Z");
});
