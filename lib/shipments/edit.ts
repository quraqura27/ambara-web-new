import {
  parseFlightLegsJson,
  resolveAirWaybill,
  type ResolvedFlightLeg,
} from "../airlines/core.ts";

export type ShipmentEditFormValues = {
  awbAirlineName: string | null;
  awbAirlinePrefix: string | null;
  awbAirlineUnresolved: boolean;
  cargoType: string;
  chargeableWeight: string | null;
  codAmount: string | null;
  commodity: string;
  customerId: number | null;
  customerName: string;
  customerReference: string | null;
  deliveryInstruction: string | null;
  destination: string;
  destinationCity: string;
  goodsDescription: string | null;
  flightLegs: ResolvedFlightLeg[];
  mawb: string | null;
  origin: string;
  pieces: number;
  postalCode: string | null;
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  serviceType: string;
  shipperAddress: string | null;
  shipperName: string | null;
  shipperPhone: string | null;
  title: string;
  weightKg: string;
};

export class ShipmentEditFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShipmentEditFormError";
  }
}

function cleanText(value: FormDataEntryValue | string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(formData: FormData, key: string, label: string) {
  const value = cleanText(formData.get(key));

  if (!value) {
    throw new ShipmentEditFormError(`${label} is required.`);
  }

  return value;
}

function optionalText(formData: FormData, key: string) {
  return cleanText(formData.get(key)) || null;
}

function positiveInteger(formData: FormData, key: string, label: string) {
  const value = requiredText(formData, key, label).replace(/,/g, "");
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ShipmentEditFormError(`${label} must be a positive whole number.`);
  }

  return parsed;
}

function positiveDecimalString(formData: FormData, key: string, label: string) {
  const value = requiredText(formData, key, label).replace(/,/g, "");
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ShipmentEditFormError(`${label} must be a positive number.`);
  }

  return String(parsed);
}

function optionalPositiveDecimalString(formData: FormData, key: string, label: string) {
  const value = cleanText(formData.get(key)).replace(/,/g, "");

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ShipmentEditFormError(`${label} must be a positive number.`);
  }

  return String(parsed);
}

function optionalNonNegativeDecimalString(formData: FormData, key: string, label: string) {
  const value = cleanText(formData.get(key)).replace(/,/g, "");

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ShipmentEditFormError(`${label} must be zero or a positive number.`);
  }

  return String(parsed);
}

function optionalCustomerId(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(cleanText(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseShipmentEditForm(formData: FormData): ShipmentEditFormValues {
  const customerName = requiredText(formData, "customerName", "Customer name");
  const origin = requiredText(formData, "origin", "Origin city");
  const destination = requiredText(formData, "destination", "Destination city");
  const receiverName = requiredText(formData, "receiverName", "Receiver name");
  const receiverPhone = requiredText(formData, "receiverPhone", "Receiver phone");
  const receiverAddress = requiredText(formData, "receiverAddress", "Receiver address");
  const destinationCity = requiredText(formData, "destinationCity", "Destination city");
  const commodity = requiredText(formData, "commodity", "Commodity");
  const serviceType = requiredText(formData, "serviceType", "Service type").toUpperCase();
  const awbInput = optionalText(formData, "mawb");
  let awb: ReturnType<typeof resolveAirWaybill> | null = null;
  let flightLegs: ResolvedFlightLeg[] = [];

  if (awbInput) {
    try {
      awb = resolveAirWaybill(awbInput, optionalText(formData, "awbAirlineName"));
    } catch (error) {
      throw new ShipmentEditFormError(
        error instanceof Error ? error.message : "AWB number is invalid.",
      );
    }
  }

  try {
    flightLegs = parseFlightLegsJson(optionalText(formData, "flightLegsJson"));
  } catch (error) {
    throw new ShipmentEditFormError(
      error instanceof Error ? error.message : "Flight-leg data is invalid.",
    );
  }

  return {
    awbAirlineName: awb?.airlineName ?? null,
    awbAirlinePrefix: awb?.prefix ?? null,
    awbAirlineUnresolved: awb?.airlineUnresolved ?? false,
    cargoType: optionalText(formData, "cargoType") ?? "general",
    chargeableWeight: optionalPositiveDecimalString(
      formData,
      "chargeableWeight",
      "Chargeable weight",
    ),
    codAmount: optionalNonNegativeDecimalString(formData, "codAmount", "COD amount"),
    commodity,
    customerId: optionalCustomerId(formData.get("customerId")),
    customerName,
    customerReference: optionalText(formData, "customerReference"),
    deliveryInstruction: optionalText(formData, "deliveryInstruction"),
    destination,
    destinationCity,
    goodsDescription: optionalText(formData, "goodsDescription"),
    flightLegs,
    mawb: awb?.canonicalNumber ?? null,
    origin,
    pieces: positiveInteger(formData, "pieces", "Pieces"),
    postalCode: optionalText(formData, "postalCode"),
    receiverAddress,
    receiverName,
    receiverPhone,
    serviceType,
    shipperAddress: optionalText(formData, "shipperAddress"),
    shipperName: optionalText(formData, "shipperName"),
    shipperPhone: optionalText(formData, "shipperPhone"),
    title: optionalText(formData, "title") || `${customerName} ${origin} to ${destination}`,
    weightKg: positiveDecimalString(formData, "weightKg", "Gross weight"),
  };
}

export function buildShipmentEditUpdates(
  input: ShipmentEditFormValues,
  editorId: number,
  updatedAt = new Date(),
) {
  return {
    parcel: {
      codAmount: input.codAmount,
      commodity: input.commodity,
      deliveryInstruction: input.deliveryInstruction,
      destinationCity: input.destinationCity,
      pieces: input.pieces,
      postalCode: input.postalCode,
      receiverAddress: input.receiverAddress,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      serviceType: input.serviceType,
      updatedAt,
      weight: input.weightKg,
    },
    shipment: {
      cargoType: input.cargoType,
      chargeableWeight: input.chargeableWeight,
      commodity: input.commodity,
      consigneeAddress: input.receiverAddress,
      consigneeName: input.receiverName,
      consigneePhone: input.receiverPhone,
      customerId: input.customerId,
      customerName: input.customerName,
      customerReference: input.customerReference,
      destination: input.destination,
      goodsDescription: input.goodsDescription,
      awbAirlineName: input.awbAirlineName,
      awbAirlinePrefix: input.awbAirlinePrefix,
      awbAirlineUnresolved: input.awbAirlineUnresolved,
      mawb: input.mawb,
      origin: input.origin,
      serviceType: input.serviceType,
      shipperAddress: input.shipperAddress,
      shipperName: input.shipperName,
      shipperPhone: input.shipperPhone,
      title: input.title,
      totalPcs: input.pieces,
      updatedAt,
      updatedByStaff: editorId,
      weightKg: input.weightKg,
    },
  };
}
