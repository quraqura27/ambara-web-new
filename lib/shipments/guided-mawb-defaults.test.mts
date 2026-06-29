import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGuidedMawbRouteDefaults,
  resolveRouteOriginFromMawbIata,
} from "./guided-mawb-defaults.ts";

test("MAWB route defaults use airport and Ambara destination display rules", () => {
  const defaults = buildGuidedMawbRouteDefaults({
    createMawbDocument: true,
    destinationIata: "TPE",
    mawb: "126-92586966",
    mawbConsigneeName: "Taiwan Agent",
    originIata: "CGK",
  });

  assert.equal(defaults.origin, "Jakarta");
  assert.equal(defaults.destination, "Taiwan");
  assert.equal(defaults.receiverName, "Taiwan Agent");
});

test("MAWB route defaults use manual destination display for unknown IATA", () => {
  const defaults = buildGuidedMawbRouteDefaults({
    createMawbDocument: true,
    destinationAirport: "Manual Destination",
    destinationIata: "ZZZ",
    mawb: "126-92586966",
    originIata: "CGK",
  });

  assert.equal(defaults.destination, "Manual Destination");
});

test("MAWB route defaults can come from an existing linked MAWB", () => {
  const defaults = buildGuidedMawbRouteDefaults({
    createMawbDocument: true,
    existingMawb: {
      consigneeAddress: "Existing consignee address",
      consigneeName: "Existing Consignee",
      destinationAirport: "Bangkok",
      destinationIata: "DMK",
      originIata: "CGK",
    },
    mawb: "126-92586966",
  });

  assert.equal(defaults.origin, "Jakarta");
  assert.equal(defaults.destination, "Bangkok");
  assert.equal(defaults.receiverAddress, "Existing consignee address");
  assert.equal(defaults.receiverName, "Existing Consignee");
});

test("MAWB route defaults stay blank when MAWB creation is disabled", () => {
  const defaults = buildGuidedMawbRouteDefaults({
    createMawbDocument: false,
    destinationIata: "KUL",
    mawb: "126-92586966",
    originIata: "CGK",
  });

  assert.deepEqual(defaults, { destination: "", origin: "", receiverAddress: "", receiverName: "" });
});

test("route origin uses public airport city before full airport name", () => {
  assert.equal(resolveRouteOriginFromMawbIata("CGK"), "Jakarta");
});
