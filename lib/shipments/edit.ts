import {
  parseFlightLegsJson,
  resolveAirWaybill,
  type ResolvedFlightLeg,
} from "../airlines/core.ts";
import {
  optionalShipmentFormText,
  parseSharedShipmentForm,
  type SharedShipmentFormValues,
} from "./form-validation.ts";

export type ShipmentEditFormValues = SharedShipmentFormValues & {
  awbAirlineName: string | null;
  awbAirlinePrefix: string | null;
  awbAirlineUnresolved: boolean;
  flightLegs: ResolvedFlightLeg[];
  mawb: string | null;
};

export class ShipmentEditFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShipmentEditFormError";
  }
}

export function parseShipmentEditForm(formData: FormData): ShipmentEditFormValues {
  const shared = parseSharedShipmentForm(formData, ShipmentEditFormError);
  const awbInput = optionalShipmentFormText(formData, "mawb");
  let awb: ReturnType<typeof resolveAirWaybill> | null = null;
  let flightLegs: ResolvedFlightLeg[] = [];

  if (awbInput) {
    try {
      awb = resolveAirWaybill(awbInput, optionalShipmentFormText(formData, "awbAirlineName"));
    } catch (error) {
      throw new ShipmentEditFormError(error instanceof Error ? error.message : "AWB number is invalid.");
    }
  }
  try {
    flightLegs = parseFlightLegsJson(optionalShipmentFormText(formData, "flightLegsJson"));
  } catch (error) {
    throw new ShipmentEditFormError(
      error instanceof Error ? error.message : "Flight-leg data is invalid.",
    );
  }

  return {
    ...shared,
    awbAirlineName: awb?.airlineName ?? null,
    awbAirlinePrefix: awb?.prefix ?? null,
    awbAirlineUnresolved: awb?.airlineUnresolved ?? false,
    flightLegs,
    mawb: awb?.canonicalNumber ?? null,
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
      awbAirlineName: input.awbAirlineName,
      awbAirlinePrefix: input.awbAirlinePrefix,
      awbAirlineUnresolved: input.awbAirlineUnresolved,
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
