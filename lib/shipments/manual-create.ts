import {
  cleanShipmentFormText,
  optionalShipmentFormText,
  parseSharedShipmentForm,
  type SharedShipmentFormValues,
} from "./form-validation.ts";

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

export type ManualShipmentFormValues = SharedShipmentFormValues & {
  internalNote: string | null;
  mawb: string | null;
  shipmentDate: Date | null;
  status: ManualShipmentStatus;
  trackingNumberInput: FormDataEntryValue | null;
};

export class ManualShipmentFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualShipmentFormError";
  }
}

function optionalDate(formData: FormData, key: string, label: string) {
  const value = cleanShipmentFormText(formData.get(key));
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) throw new ManualShipmentFormError(`${label} must be a valid date.`);
  return parsed;
}

function normalizeCreateStatus(value: FormDataEntryValue | string | null): ManualShipmentStatus {
  const status = cleanShipmentFormText(value).toLowerCase();
  return manualShipmentStatuses.includes(status as ManualShipmentStatus)
    ? (status as ManualShipmentStatus)
    : "pending";
}

export function parseManualShipmentForm(formData: FormData): ManualShipmentFormValues {
  return {
    ...parseSharedShipmentForm(formData, ManualShipmentFormError),
    internalNote: optionalShipmentFormText(formData, "internalNote"),
    mawb: optionalShipmentFormText(formData, "mawb")?.toUpperCase() ?? null,
    shipmentDate: optionalDate(formData, "shipmentDate", "Shipment date"),
    status: normalizeCreateStatus(formData.get("status")),
    trackingNumberInput: formData.get("trackingNumber"),
  };
}
