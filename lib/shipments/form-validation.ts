import { normalizeShipmentService } from "./service-model.ts";

export type ShipmentFormErrorConstructor = new (message: string) => Error;

export type SharedShipmentFormValues = {
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

export function cleanShipmentFormText(value: FormDataEntryValue | string | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalShipmentFormText(formData: FormData, key: string) {
  return cleanShipmentFormText(formData.get(key)) || null;
}

function fail(ErrorType: ShipmentFormErrorConstructor, message: string): never {
  throw new ErrorType(message);
}

function requiredText(
  formData: FormData,
  key: string,
  label: string,
  ErrorType: ShipmentFormErrorConstructor,
) {
  const value = cleanShipmentFormText(formData.get(key));
  return value || fail(ErrorType, `${label} is required.`);
}

function positiveInteger(
  formData: FormData,
  key: string,
  label: string,
  ErrorType: ShipmentFormErrorConstructor,
) {
  const parsed = Number(requiredText(formData, key, label, ErrorType).replace(/,/g, ""));
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fail(ErrorType, `${label} must be a positive whole number.`);
  }
  return parsed;
}

function decimalString(
  formData: FormData,
  key: string,
  label: string,
  ErrorType: ShipmentFormErrorConstructor,
  options: { optional?: boolean; zeroAllowed?: boolean } = {},
) {
  const value = cleanShipmentFormText(formData.get(key)).replace(/,/g, "");
  if (!value && options.optional) return null;
  if (!value) fail(ErrorType, `${label} is required.`);
  const parsed = Number(value);
  const invalid = !Number.isFinite(parsed) || (options.zeroAllowed ? parsed < 0 : parsed <= 0);
  if (invalid) {
    fail(
      ErrorType,
      options.zeroAllowed
        ? `${label} must be zero or a positive number.`
        : `${label} must be a positive number.`,
    );
  }
  return String(parsed);
}

function validatedPhone(
  formData: FormData,
  key: string,
  label: string,
  ErrorType: ShipmentFormErrorConstructor,
  optional = false,
) {
  const value = cleanShipmentFormText(formData.get(key));
  if (!value && optional) return null;
  if (!value) fail(ErrorType, `${label} is required.`);
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    fail(ErrorType, `${label} must contain 7 to 15 digits.`);
  }
  return value;
}

export function parseSharedShipmentForm(
  formData: FormData,
  ErrorType: ShipmentFormErrorConstructor,
): SharedShipmentFormValues {
  const customerName = requiredText(formData, "customerName", "Customer name", ErrorType);
  const origin = requiredText(formData, "origin", "Origin city", ErrorType);
  const destination = requiredText(formData, "destination", "Destination city", ErrorType);
  const serviceInput = requiredText(formData, "serviceType", "Service type", ErrorType);
  const serviceType = normalizeShipmentService(serviceInput);
  if (!serviceType) fail(ErrorType, "Select a valid service type.");
  const cargoType = optionalShipmentFormText(formData, "cargoType") ?? "general";
  if (!["general", "perishable", "dangerous_goods", "consolidated"].includes(cargoType)) {
    fail(ErrorType, "Select a valid cargo type.");
  }
  const customerIdValue = Number.parseInt(cleanShipmentFormText(formData.get("customerId")), 10);

  return {
    cargoType,
    chargeableWeight: decimalString(formData, "chargeableWeight", "Chargeable weight", ErrorType, {
      optional: true,
    }),
    codAmount: decimalString(formData, "codAmount", "COD amount", ErrorType, {
      optional: true,
      zeroAllowed: true,
    }),
    commodity: requiredText(formData, "commodity", "Commodity", ErrorType),
    customerId: Number.isInteger(customerIdValue) && customerIdValue > 0 ? customerIdValue : null,
    customerName,
    customerReference: optionalShipmentFormText(formData, "customerReference"),
    deliveryInstruction: optionalShipmentFormText(formData, "deliveryInstruction"),
    destination,
    destinationCity: requiredText(formData, "destinationCity", "Destination city", ErrorType),
    goodsDescription: optionalShipmentFormText(formData, "goodsDescription"),
    origin,
    pieces: positiveInteger(formData, "pieces", "Pieces", ErrorType),
    postalCode: optionalShipmentFormText(formData, "postalCode"),
    receiverAddress: requiredText(formData, "receiverAddress", "Receiver address", ErrorType),
    receiverName: requiredText(formData, "receiverName", "Receiver name", ErrorType),
    receiverPhone: validatedPhone(formData, "receiverPhone", "Receiver phone", ErrorType) as string,
    serviceType,
    shipperAddress: optionalShipmentFormText(formData, "shipperAddress"),
    shipperName: optionalShipmentFormText(formData, "shipperName"),
    shipperPhone: validatedPhone(formData, "shipperPhone", "Shipper phone", ErrorType, true),
    title:
      optionalShipmentFormText(formData, "title") || `${customerName} ${origin} to ${destination}`,
    weightKg: decimalString(formData, "weightKg", "Gross weight", ErrorType) as string,
  };
}
