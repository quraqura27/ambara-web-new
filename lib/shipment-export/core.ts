import { hasPortalRoleAtLeast, type PortalRoleUser } from "../portal-roles.ts";

export const shipmentExportScopes = [
  "summary",
  "parcels",
  "vendor_tracking",
  "tracking_events",
] as const;

export type ShipmentExportScope = (typeof shipmentExportScopes)[number];

export const shipmentExportFormats = ["csv", "xlsx"] as const;

export type ShipmentExportFormat = (typeof shipmentExportFormats)[number];

export const shipmentExportDateBases = [
  "created_at",
  "updated_at",
  "delivered_at",
  "event_time",
] as const;

export type ShipmentExportDateBasis = (typeof shipmentExportDateBases)[number];

export const shipmentExportStatuses = [
  "all",
  "pending",
  "received",
  "processed",
  "departed_origin",
  "in_progress",
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

export type ShipmentExportStatus = (typeof shipmentExportStatuses)[number];

export const shipmentExportMaxRangeDays = 90;
export const shipmentExportMaxRows = 5_000;

export type ShipmentExportFilters = {
  customer: string;
  dateBasis: ShipmentExportDateBasis;
  deliveryBatch: string;
  destination: string;
  format: ShipmentExportFormat;
  fromDate: string;
  fromDateTime: Date;
  includeInternalEvents: boolean;
  origin: string;
  scope: ShipmentExportScope;
  serviceType: string;
  status: ShipmentExportStatus;
  toDate: string;
  toDateTime: Date;
  vendor: string;
};

export type ShipmentExportParseResult = {
  errors: string[];
  filters: ShipmentExportFilters;
};

export type ShipmentExportColumn = {
  header: string;
  key: string;
};

export const xlsxExportUnavailableMessage =
  "XLSX export is not enabled yet. Use CSV / Excel-compatible CSV.";

const scopeFilenameSegments: Record<ShipmentExportScope, string> = {
  summary: "summary",
  parcels: "parcels",
  vendor_tracking: "vendor_tracking",
  tracking_events: "tracking_events",
};

const defaultDateRangeDays = 30;

function isOneOf<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return (values as readonly string[]).includes(value);
}

function dateInputFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string, boundary: "start" | "end") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  const day = Number.parseInt(match[3] ?? "", 10);
  const date =
    boundary === "start"
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function stringParam(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? "";
}

function defaultDateRange(now: Date) {
  const toDate = new Date(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - defaultDateRangeDays);

  return {
    fromDate: dateInputFromDate(fromDate),
    toDate: dateInputFromDate(toDate),
  };
}

export function parseShipmentExportFilters(
  params: URLSearchParams,
  now = new Date(),
): ShipmentExportParseResult {
  const defaults = defaultDateRange(now);
  const errors: string[] = [];
  const scopeInput = stringParam(params, "scope") || "summary";
  const formatInput = stringParam(params, "format") || "csv";
  const dateBasisInput = stringParam(params, "date_basis") || "created_at";
  const statusInput = stringParam(params, "status") || "all";
  const fromDate = stringParam(params, "from_date") || defaults.fromDate;
  const toDate = stringParam(params, "to_date") || defaults.toDate;

  const scope = isOneOf(shipmentExportScopes, scopeInput) ? scopeInput : "summary";
  const format = isOneOf(shipmentExportFormats, formatInput) ? formatInput : "csv";
  const dateBasis = isOneOf(shipmentExportDateBases, dateBasisInput)
    ? dateBasisInput
    : "created_at";
  const status = isOneOf(shipmentExportStatuses, statusInput) ? statusInput : "all";
  const fromDateTime = parseDateInput(fromDate, "start");
  const toDateTime = parseDateInput(toDate, "end");

  if (!isOneOf(shipmentExportScopes, scopeInput)) {
    errors.push("Invalid export scope.");
  }

  if (!isOneOf(shipmentExportFormats, formatInput)) {
    errors.push("Invalid export format.");
  }

  if (!isOneOf(shipmentExportDateBases, dateBasisInput)) {
    errors.push("Invalid date basis.");
  }

  if (!isOneOf(shipmentExportStatuses, statusInput)) {
    errors.push("Invalid shipment status.");
  }

  if (!fromDateTime) {
    errors.push("From date must use YYYY-MM-DD.");
  }

  if (!toDateTime) {
    errors.push("To date must use YYYY-MM-DD.");
  }

  if (fromDateTime && toDateTime) {
    if (fromDateTime.getTime() > toDateTime.getTime()) {
      errors.push("From date must be before or equal to to date.");
    }

    const rangeMs = toDateTime.getTime() - fromDateTime.getTime();
    const rangeDays = rangeMs / (24 * 60 * 60 * 1000);

    if (rangeDays > shipmentExportMaxRangeDays) {
      errors.push(`Date range cannot exceed ${shipmentExportMaxRangeDays} days.`);
    }
  }

  if (dateBasis === "event_time" && scope !== "tracking_events") {
    errors.push("Event time date basis is only available for tracking event detail exports.");
  }

  return {
    errors,
    filters: {
      customer: stringParam(params, "customer"),
      dateBasis,
      deliveryBatch: stringParam(params, "delivery_batch"),
      destination: stringParam(params, "destination"),
      format,
      fromDate,
      fromDateTime: fromDateTime ?? parseDateInput(defaults.fromDate, "start") ?? new Date(now),
      includeInternalEvents: params.get("include_internal_events") === "true",
      origin: stringParam(params, "origin"),
      scope,
      serviceType: stringParam(params, "service_type"),
      status,
      toDate,
      toDateTime: toDateTime ?? parseDateInput(defaults.toDate, "end") ?? new Date(now),
      vendor: stringParam(params, "vendor"),
    },
  };
}

export function canExportShipments(user: PortalRoleUser | null | undefined) {
  return hasPortalRoleAtLeast(user, "admin");
}

function normalizeExportCellValue(value: unknown) {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }

  return String(value);
}

export function sanitizeExportCellValue(value: unknown) {
  const text = normalizeExportCellValue(value);

  if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

export function escapeCsvCell(value: unknown) {
  const text = sanitizeExportCellValue(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function buildCsv(columns: ShipmentExportColumn[], rows: Array<Record<string, unknown>>) {
  const headerLine = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const rowLines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(row[column.key])).join(","),
  );

  return `${[headerLine, ...rowLines].join("\n")}\n`;
}

export const shipmentSummaryColumns: ShipmentExportColumn[] = [
  { key: "ambara_tracking_number", header: "ambara_tracking_number" },
  { key: "customer_name", header: "customer_name" },
  { key: "customer_reference", header: "customer_reference" },
  { key: "shipper_name", header: "shipper_name" },
  { key: "shipper_phone", header: "shipper_phone" },
  { key: "origin_city", header: "origin_city" },
  { key: "destination_city", header: "destination_city" },
  { key: "service_type", header: "service_type" },
  { key: "commodity", header: "commodity" },
  { key: "current_status", header: "current_status" },
  { key: "total_parcels", header: "total_parcels" },
  { key: "total_weight", header: "total_weight" },
  { key: "created_at", header: "created_at" },
  { key: "updated_at", header: "updated_at" },
  { key: "latest_public_status", header: "latest_public_status" },
  { key: "latest_public_event_time", header: "latest_public_event_time" },
];

export const parcelDetailColumns: ShipmentExportColumn[] = [
  { key: "ambara_tracking_number", header: "ambara_tracking_number" },
  { key: "ambara_parcel_id", header: "ambara_parcel_id" },
  { key: "parcel_number", header: "parcel_number" },
  { key: "customer_name", header: "customer_name" },
  { key: "customer_reference", header: "customer_reference" },
  { key: "receiver_name", header: "receiver_name" },
  { key: "receiver_phone", header: "receiver_phone" },
  { key: "receiver_address", header: "receiver_address" },
  { key: "destination_city", header: "destination_city" },
  { key: "postal_code", header: "postal_code" },
  { key: "weight", header: "weight" },
  { key: "pieces", header: "pieces" },
  { key: "commodity", header: "commodity" },
  { key: "service_type", header: "service_type" },
  { key: "parcel_status", header: "parcel_status" },
  { key: "shipment_status", header: "shipment_status" },
  { key: "created_at", header: "created_at" },
  { key: "updated_at", header: "updated_at" },
];

export const vendorTrackingColumns: ShipmentExportColumn[] = [
  { key: "ambara_tracking_number", header: "ambara_tracking_number" },
  { key: "ambara_parcel_id", header: "ambara_parcel_id" },
  { key: "delivery_batch_code", header: "delivery_batch_code" },
  { key: "vendor_name", header: "vendor_name" },
  { key: "vendor_service_type", header: "vendor_service_type" },
  { key: "vendor_tracking_number", header: "vendor_tracking_number" },
  { key: "vendor_reference_number", header: "vendor_reference_number" },
  { key: "last_vendor_status", header: "last_vendor_status" },
  { key: "last_vendor_event_time", header: "last_vendor_event_time" },
  { key: "pod_url", header: "pod_url" },
  { key: "receiver_name", header: "receiver_name" },
  { key: "parcel_status", header: "parcel_status" },
  { key: "shipment_status", header: "shipment_status" },
  { key: "created_at", header: "created_at" },
  { key: "updated_at", header: "updated_at" },
];

const publicTrackingEventColumns: ShipmentExportColumn[] = [
  { key: "ambara_tracking_number", header: "ambara_tracking_number" },
  { key: "ambara_parcel_id", header: "ambara_parcel_id" },
  { key: "status_code", header: "status_code" },
  { key: "label", header: "label" },
  { key: "public_description", header: "public_description" },
  { key: "location", header: "location" },
  { key: "event_time", header: "event_time" },
  { key: "source", header: "source" },
  { key: "visible_to_customer", header: "visible_to_customer" },
  { key: "created_at", header: "created_at" },
];

const internalTrackingEventColumns: ShipmentExportColumn[] = [
  { key: "description", header: "description" },
  { key: "internal_note", header: "internal_note" },
];

export function getTrackingEventColumns(includeInternalEvents: boolean) {
  return includeInternalEvents
    ? [...publicTrackingEventColumns, ...internalTrackingEventColumns]
    : publicTrackingEventColumns;
}

export function getShipmentExportColumns(filters: Pick<ShipmentExportFilters, "includeInternalEvents" | "scope">) {
  if (filters.scope === "summary") {
    return shipmentSummaryColumns;
  }

  if (filters.scope === "parcels") {
    return parcelDetailColumns;
  }

  if (filters.scope === "vendor_tracking") {
    return vendorTrackingColumns;
  }

  return getTrackingEventColumns(filters.includeInternalEvents);
}

export function buildShipmentExportCsv(
  filters: Pick<ShipmentExportFilters, "includeInternalEvents" | "scope">,
  rows: Array<Record<string, unknown>>,
) {
  return buildCsv(getShipmentExportColumns(filters), rows);
}

export function buildShipmentExportFilename(filters: Pick<ShipmentExportFilters, "format" | "fromDate" | "scope" | "toDate">) {
  return `ambara_shipments_${scopeFilenameSegments[filters.scope]}_${filters.fromDate}_to_${filters.toDate}.${filters.format}`;
}

export function isXlsxExportEnabled() {
  return false;
}
