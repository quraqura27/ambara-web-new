import assert from "node:assert/strict";
import test from "node:test";

import { buildGuidedShipmentCopyValues } from "./guided-copy.ts";

test("copy shipment prefill keeps operational fields and blanks unsafe identifiers", () => {
  const values = buildGuidedShipmentCopyValues({
    flightLegs: [
      {
        airlineDesignator: "GA",
        airlineName: "Garuda Indonesia",
        flightNumber: "820",
        operationalSuffix: null,
        sequence: 1,
      },
    ],
    parcels: [
      {
        deliveryInstruction: "Call receiver",
        destinationCity: "Bandung",
        pieces: 4,
        postalCode: "40111",
        receiverAddress: "Jl. Test",
        receiverName: "Receiver",
        receiverPhone: "+6281234567890",
        serviceType: "DTD",
        weight: "12.5",
      },
    ],
    shipment: {
      cargoType: "general",
      chargeableWeight: "13",
      commodity: "Garments",
      consigneeAddress: "Old consignee address",
      consigneeName: "Receiver",
      consigneePhone: "+6281234567890",
      customerId: 42,
      customerName: "Customer",
      destination: "Jakarta",
      destinationIata: "CGK",
      goodsDescription: "Garments sample",
      origin: "Singapore",
      originIata: "SIN",
      serviceType: "DTD",
      shipperAddress: "Pickup address",
      shipperName: "Shipper",
      shipperPhone: "+6561234567",
      totalPcs: 4,
      trackingNumber: "AA26-OLD",
      weightKg: "12.5",
    },
  });

  assert.equal(values.customerId, "42");
  assert.equal(values.destination, "Jakarta");
  assert.equal(values.destinationCity, "Bandung");
  assert.equal(values.destinationCityDifferent, "yes");
  assert.equal(values.originIata, "SIN");
  assert.equal(values.departureIataDifferent, "yes");
  assert.equal(values.receiverAddress, "Jl. Test");
  assert.equal(values.flightLegsJson, JSON.stringify([
    {
      airlineName: "Garuda Indonesia",
      flightNumber: "GA820",
      id: "copied-flight-1",
    },
  ]));

  assert.equal(values.mawb, "");
  assert.equal(values.awbAirlineName, "");
  assert.equal(values.createMawbDocument, "no");
  assert.equal(values.trackingNumber, "");
  assert.equal(values.customerReference, "");
  assert.equal(values.reviewConfirmed, "");
});

test("copy shipment does not mark final city different when it matches route destination", () => {
  const values = buildGuidedShipmentCopyValues({
    parcels: [{ destinationCity: "Surabaya", serviceType: "DTD" }],
    shipment: {
      destination: "Surabaya",
      origin: "Jakarta",
      serviceType: "DTD",
      trackingNumber: "AA26-SAME",
    },
  });

  assert.equal(values.destinationCity, "Surabaya");
  assert.equal(values.destinationCityDifferent, "");
});
