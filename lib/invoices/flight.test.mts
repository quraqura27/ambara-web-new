import assert from "node:assert/strict";
import test from "node:test";

import { formatInvoiceFlightNumber } from "./flight.ts";

test("formats invoice flight numbers from ordered shipment legs", () => {
  assert.equal(
    formatInvoiceFlightNumber([
      { airlineDesignator: "GA", flightNumber: "820", operationalSuffix: null },
      { airlineDesignator: "SQ", flightNumber: "956", operationalSuffix: "A" },
    ]),
    "GA820|SQ956A",
  );
});

test("uses MAWB flight fallback when shipment legs are unavailable", () => {
  assert.equal(formatInvoiceFlightNumber([], "GA123"), "GA123");
  assert.equal(formatInvoiceFlightNumber([], null), null);
});
