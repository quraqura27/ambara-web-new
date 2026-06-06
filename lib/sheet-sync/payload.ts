export const sheetShipmentAllowedFields = [
  "ready_to_generate",
  "internal_tracking_no",
  "tracking_created_at",
  "generation_status",
  "mawb",
  "title",
  "current_status",
  "service_type",
  "sla_days",
  "origin",
  "origin_iata",
  "destination",
  "destination_iata",
  "customer_name",
  "shipper_name",
  "shipper_address",
  "shipper_phone",
  "consignee_name",
  "consignee_address",
  "consignee_phone",
  "goods_description",
  "cargo_type",
  "commodity",
  "total_pcs",
  "weight_kg",
  "chargeable_weight",
  "created_at",
  "updated_at",
  "active",
  "internal_notes",
] as const;

const allowedFieldSet = new Set<string>(sheetShipmentAllowedFields);

const allowedStatuses = new Set([
  "pending",
  "received",
  "processed",
  "departed_origin",
  "in_transit",
  "customs",
  "customs_review",
  "arrived_destination",
  "out_for_delivery",
  "delivered",
  "exception",
  "cancelled",
]);

export type SheetShipmentUpsertValues = {
  trackingNumber: string;
  mawb: string | null;
  title: string;
  internalTrackingNo: string;
  status: string;
  origin: string;
  destination: string;
  serviceType: string | null;
  shipperName: string | null;
  shipperAddress: string | null;
  shipperPhone: string | null;
  consigneeName: string | null;
  consigneeAddress: string | null;
  consigneePhone: string | null;
  customerName: string | null;
  goodsDescription: string | null;
  originIata: string | null;
  destinationIata: string | null;
  totalPcs: number | null;
  weightKg: string | null;
  chargeableWeight: string | null;
  cargoType: string | null;
  commodity: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ParsedSheetShipmentPayload = {
  trackingNumber: string;
  values: SheetShipmentUpsertValues;
  ignoredFields: string[];
};

type ParseOptions = {
  now?: Date;
};

export class SheetShipmentPayloadError extends Error {
  readonly code = "SYNC_INVALID_PAYLOAD";
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "SheetShipmentPayloadError";
    this.details = details;
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function optionalText(value: unknown) {
  const text = cleanText(value);
  return text ? text : null;
}

function requiredText(data: Record<string, unknown>, key: string) {
  const text = optionalText(data[key]);
  if (!text) {
    throw new SheetShipmentPayloadError(`Missing required field: ${key}`, [key]);
  }
  return text;
}

function optionalInteger(value: unknown, key: string) {
  const text = cleanText(value).replace(/,/g, "");
  if (!text) return null;

  const parsed = Number(text);
  if (!Number.isInteger(parsed)) {
    throw new SheetShipmentPayloadError(`Invalid integer field: ${key}`, [key]);
  }

  return parsed;
}

function optionalDecimalString(value: unknown, key: string) {
  const text = cleanText(value).replace(/,/g, "");
  if (!text) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    throw new SheetShipmentPayloadError(`Invalid numeric field: ${key}`, [key]);
  }

  return String(parsed);
}

function optionalDate(value: unknown, key: string) {
  if (value == null || cleanText(value) === "") return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new SheetShipmentPayloadError(`Invalid date field: ${key}`, [key]);
  }

  return parsed;
}

function normalizeStatus(value: unknown) {
  const status = cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (!status) return "pending";
  if (!allowedStatuses.has(status)) {
    throw new SheetShipmentPayloadError("Invalid shipment status", ["current_status"]);
  }
  return status;
}

function findUnknownFields(data: Record<string, unknown>) {
  return Object.keys(data).filter((key) => !allowedFieldSet.has(key));
}

export function parseSheetShipmentPayload(
  payload: unknown,
  options: ParseOptions = {},
): ParsedSheetShipmentPayload {
  const data = objectValue(payload);
  if (!data) {
    throw new SheetShipmentPayloadError("Payload must be a JSON object");
  }

  const unknownFields = findUnknownFields(data);
  if (unknownFields.length) {
    throw new SheetShipmentPayloadError("Payload contains unsupported field(s)", unknownFields);
  }

  const internalTrackingNo = requiredText(data, "internal_tracking_no").toUpperCase();
  const title = requiredText(data, "title");
  const origin = requiredText(data, "origin");
  const destination = requiredText(data, "destination");
  const mawb = optionalText(data.mawb)?.toUpperCase() ?? null;
  const now = options.now ?? new Date();
  const createdAt = optionalDate(data.created_at, "created_at") ?? now;
  const updatedAt = optionalDate(data.updated_at, "updated_at") ?? now;

  return {
    trackingNumber: internalTrackingNo,
    ignoredFields: [
      "ready_to_generate",
      "tracking_created_at",
      "generation_status",
      "sla_days",
      "active",
      "internal_notes",
    ],
    values: {
      trackingNumber: internalTrackingNo,
      mawb,
      title,
      internalTrackingNo,
      status: normalizeStatus(data.current_status),
      origin,
      destination,
      serviceType: optionalText(data.service_type),
      shipperName: optionalText(data.shipper_name),
      shipperAddress: optionalText(data.shipper_address),
      shipperPhone: optionalText(data.shipper_phone),
      consigneeName: optionalText(data.consignee_name),
      consigneeAddress: optionalText(data.consignee_address),
      consigneePhone: optionalText(data.consignee_phone),
      customerName: optionalText(data.customer_name),
      goodsDescription: optionalText(data.goods_description),
      originIata: optionalText(data.origin_iata)?.toUpperCase() ?? null,
      destinationIata: optionalText(data.destination_iata)?.toUpperCase() ?? null,
      totalPcs: optionalInteger(data.total_pcs, "total_pcs"),
      weightKg: optionalDecimalString(data.weight_kg, "weight_kg"),
      chargeableWeight: optionalDecimalString(data.chargeable_weight, "chargeable_weight"),
      cargoType: optionalText(data.cargo_type),
      commodity: optionalText(data.commodity),
      createdBy: "google-sheets",
      createdAt,
      updatedAt,
    },
  };
}
