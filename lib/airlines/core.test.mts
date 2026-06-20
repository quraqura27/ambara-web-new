import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAirWaybillCheckDigit,
  findAirlinesByDesignator,
  findAirlinesByPrefix,
  resolveAirWaybill,
  resolveFlightLeg,
} from "./core.ts";

test("resolves known AWB prefixes and calculates a missing check digit", () => {
  const serial = "9360193";
  const expectedCheckDigit = calculateAirWaybillCheckDigit(serial);
  const result = resolveAirWaybill(`126-${serial}`);

  assert.equal(result.canonicalNumber, `126-${serial}${expectedCheckDigit}`);
  assert.equal(result.airlineName, "Garuda Indonesia");
  assert.equal(result.airlineUnresolved, false);
});

test("rejects an invalid AWB check digit", () => {
  assert.throws(
    () => resolveAirWaybill("126-93601939"),
    /AWB check digit is invalid/,
  );
});

test("requires a manual airline for an unknown AWB prefix", () => {
  assert.throws(() => resolveAirWaybill("000-1234567"), /Enter the airline name/);
  const result = resolveAirWaybill("000-1234567", "Example Cargo");
  assert.equal(result.airlineName, "Example Cargo");
  assert.equal(result.airlineUnresolved, true);
});

test("resolves alphanumeric IATA flight designators", () => {
  assert.equal(resolveFlightLeg("ga820").airlineName, "Garuda Indonesia");
  assert.equal(resolveFlightLeg("A3 90").formattedNumber, "A390");
  assert.ok(findAirlinesByDesignator("M0").length > 0);
});

test("reference lookup preserves three-digit leading zero prefixes", () => {
  assert.equal(findAirlinesByPrefix("053")[0]?.name, "Aer Lingus");
});
