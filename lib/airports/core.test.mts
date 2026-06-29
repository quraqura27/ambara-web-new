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

test("resolves public airport references beyond the Ambara examples", () => {
  assert.equal(resolveAirportByIata("LHR")?.airportName, "London Heathrow Airport");
  assert.equal(resolveMawbDestinationDisplay("JFK"), "New York");
});

test("allows manual destination display for unknown airport IATA codes", () => {
  assert.equal(resolveAirportByIata("ZZZ"), null);
  assert.equal(resolveMawbDestinationDisplay("ZZZ"), null);
  assert.equal(resolveMawbDestinationDisplay("ZZZ", "Manual Destination"), "Manual Destination");
});
