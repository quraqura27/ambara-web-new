import { getShipmentServiceDefinition } from "./service-model.ts";

type CopyShipment = {
  cargoType?: string | null;
  chargeableWeight?: number | string | null;
  commodity?: string | null;
  consigneeAddress?: string | null;
  consigneeName?: string | null;
  consigneePhone?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  destination: string;
  destinationIata?: string | null;
  goodsDescription?: string | null;
  origin: string;
  originIata?: string | null;
  serviceType?: string | null;
  shipperAddress?: string | null;
  shipperName?: string | null;
  shipperPhone?: string | null;
  totalPcs?: number | null;
  trackingNumber: string;
  unlinkedReason?: string | null;
  weightKg?: number | string | null;
};

type CopyParcel = {
  commodity?: string | null;
  deliveryInstruction?: string | null;
  destinationCity?: string | null;
  pieces?: number | null;
  postalCode?: string | null;
  receiverAddress?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  serviceType?: string | null;
  weight?: number | string | null;
};

type CopyFlightLeg = {
  airlineDesignator: string;
  airlineName: string;
  flightNumber: string;
  operationalSuffix?: string | null;
  sequence: number;
};

export type GuidedShipmentCopyValues = Partial<Record<string, string>>;

function stringValue(value: number | string | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function optionalPhone(value: string | null | undefined) {
  return value && value !== "-" ? value : "";
}

export function buildGuidedShipmentCopyValues({
  flightLegs = [],
  parcels = [],
  shipment,
}: {
  flightLegs?: CopyFlightLeg[];
  parcels?: CopyParcel[];
  shipment: CopyShipment;
}): GuidedShipmentCopyValues {
  const primaryParcel = parcels[0];
  const serviceType = shipment.serviceType || primaryParcel?.serviceType || "DTD";
  const service = getShipmentServiceDefinition(serviceType);
  const copiedDestinationCity = primaryParcel?.destinationCity || shipment.destination;
  const destinationCityDifferent =
    service?.doorDelivery && copiedDestinationCity && copiedDestinationCity !== shipment.destination
      ? "yes"
      : "";
  const flightLegsJson = JSON.stringify(
    flightLegs.map((leg) => ({
      airlineName: leg.airlineName,
      flightNumber: `${leg.airlineDesignator}${leg.flightNumber}${leg.operationalSuffix ?? ""}`,
      id: `copied-flight-${leg.sequence}`,
    })),
  );

  return {
    awbAirlineName: "",
    cargoType: shipment.cargoType || "general",
    chargeableWeight: stringValue(shipment.chargeableWeight),
    commodity: shipment.commodity || primaryParcel?.commodity || "",
    createMawbDocument: "no",
    customerId: shipment.customerId ? String(shipment.customerId) : "",
    customerMode: shipment.customerId ? "existing" : shipment.customerName ? "unlinked" : "existing",
    customerName: shipment.customerId ? "" : shipment.customerName || "",
    customerReference: "",
    deliveryInstruction: service?.doorDelivery ? primaryParcel?.deliveryInstruction || "" : "",
    departureIataDifferent: shipment.originIata && shipment.originIata !== "CGK" ? "yes" : "",
    destination: shipment.destination,
    destinationCity: copiedDestinationCity,
    destinationCityDifferent,
    destinationIata: shipment.destinationIata || "",
    flightLegsJson,
    goodsDescription: shipment.goodsDescription || "",
    mawb: "",
    origin: shipment.origin,
    originIata: shipment.originIata || "CGK",
    pieces: shipment.totalPcs ? String(shipment.totalPcs) : primaryParcel?.pieces ? String(primaryParcel.pieces) : "1",
    postalCode: service?.doorDelivery ? primaryParcel?.postalCode || "" : "",
    receiverAddress: service?.doorDelivery ? primaryParcel?.receiverAddress || shipment.consigneeAddress || "" : "",
    receiverName: shipment.consigneeName || primaryParcel?.receiverName || "",
    receiverPhone: optionalPhone(shipment.consigneePhone || primaryParcel?.receiverPhone),
    reviewConfirmed: "",
    routingTo1: shipment.destinationIata || "",
    serviceType,
    shipperAddress: shipment.shipperAddress || "",
    shipperName: shipment.shipperName || "",
    shipperPhone: optionalPhone(shipment.shipperPhone),
    title: "",
    trackingNumber: "",
    unlinkedReason: shipment.customerId ? "" : shipment.unlinkedReason || `Copied from ${shipment.trackingNumber}.`,
    weightKg: stringValue(shipment.weightKg || primaryParcel?.weight),
  };
}
