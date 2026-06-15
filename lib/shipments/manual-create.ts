export const manualShipmentStatuses = [
  "pending",
  "received",
  "processed",
  "departed_origin",
  "in_transit",
  "customs",
  "arrived_destination",
  "out_for_delivery",
  "delivered",
  "delivery_issue",
  "return_in_progress",
  "on_hold",
  "exception",
  "cancelled",
] as const;

export type ManualShipmentStatus = (typeof manualShipmentStatuses)[number];

export type ManualShipmentFormValues = {
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
  internalNote: string | null;
  mawb: string | null;
  origin: string;
  pieces: number;
  postalCode: string | null;
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  serviceType: string;
  shipmentDate: Date | null;
  shipperAddress: string | null;
  shipperName: string | null;
  shipperPhone: string | null;
  status: ManualShipmentStatus;
  title: string;
  trackingNumberInput: FormDataEntryValue | null;
  weightKg: string;
};

export class ManualShipmentFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualShipmentFormError";
  }
}

function cleanText(value: FormDataEntryValue | string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(formData: FormData, key: string, label: string) {
  const value = cleanText(formData.get(key));

  if (!value) {
    throw new ManualShipmentFormError(`${label} is required.`);
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
    throw new ManualShipmentFormError(`${label} must be a positive whole number.`);
  }

  return parsed;
}

function positiveDecimalString(formData: FormData, key: string, label: string) {
  const value = requiredText(formData, key, label).replace(/,/g, "");
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ManualShipmentFormError(`${label} must be a positive number.`);
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
    throw new ManualShipmentFormError(`${label} must be a positive number.`);
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
    throw new ManualShipmentFormError(`${label} must be zero or a positive number.`);
  }

  return String(parsed);
}

function optionalDate(formData: FormData, key: string, label: string) {
  const value = cleanText(formData.get(key));

  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ManualShipmentFormError(`${label} must be a valid date.`);
  }

  return parsed;
}

function normalizeCreateStatus(value: FormDataEntryValue | string | null): ManualShipmentStatus {
  const status = cleanText(value).toLowerCase();

  if (manualShipmentStatuses.includes(status as ManualShipmentStatus)) {
    return status as ManualShipmentStatus;
  }

  return "pending";
}

function optionalCustomerId(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(cleanText(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseManualShipmentForm(formData: FormData): ManualShipmentFormValues {
  const customerName = requiredText(formData, "customerName", "Customer name");
  const origin = requiredText(formData, "origin", "Origin city");
  const destination = requiredText(formData, "destination", "Destination city");
  const receiverName = requiredText(formData, "receiverName", "Receiver name");
  const receiverPhone = requiredText(formData, "receiverPhone", "Receiver phone");
  const receiverAddress = requiredText(formData, "receiverAddress", "Receiver address");
  const destinationCity = requiredText(formData, "destinationCity", "Destination city");
  const commodity = requiredText(formData, "commodity", "Commodity");
  const serviceType = requiredText(formData, "serviceType", "Service type").toUpperCase();

  return {
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
    internalNote: optionalText(formData, "internalNote"),
    mawb: optionalText(formData, "mawb")?.toUpperCase() ?? null,
    origin,
    pieces: positiveInteger(formData, "pieces", "Pieces"),
    postalCode: optionalText(formData, "postalCode"),
    receiverAddress,
    receiverName,
    receiverPhone,
    serviceType,
    shipmentDate: optionalDate(formData, "shipmentDate", "Shipment date"),
    shipperAddress: optionalText(formData, "shipperAddress"),
    shipperName: optionalText(formData, "shipperName"),
    shipperPhone: optionalText(formData, "shipperPhone"),
    status: normalizeCreateStatus(formData.get("status")),
    title: optionalText(formData, "title") || `${customerName} ${origin} to ${destination}`,
    trackingNumberInput: formData.get("trackingNumber"),
    weightKg: positiveDecimalString(formData, "weightKg", "Gross weight"),
  };
}
