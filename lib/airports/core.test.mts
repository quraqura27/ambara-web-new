import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveAirportByIata,
  resolveMawbDepartureAirport,
  resolveMawbDestinationDisplay,
} from "./core.ts";

test("resolves MAWB departure airport by full airport name", () => {
  assert.equal(resolveMawbDepartureAirport("CGK"), "Soekarno-Hatta International Airport");
});

test("resolves MAWB destination business display values", () => {
  assert.equal(resolveMawbDestinationDisplay("KUL"), "Kuala Lumpur");
  assert.equal(resolveMawbDestinationDisplay("TPE"), "Taiwan");
  assert.equal(resolveMawbDestinationDisplay("DMK"), "Bangkok");
});

test("rejects unknown airport IATA codes", () => {
  assert.equal(resolveAirportByIata("ZZZ"), null);
  assert.equal(resolveMawbDestinationDisplay("ZZZ"), null);
});
