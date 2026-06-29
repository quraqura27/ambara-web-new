import {
  resolveAirportByIata,
  resolveMawbDepartureAirport,
  resolveMawbDestinationDisplay,
} from "../airports/core.ts";

export type GuidedMawbRouteDefaults = {
  destination: string;
  origin: string;
  receiverAddress: string;
  receiverName: string;
};

export type GuidedMawbRouteDefaultSource = {
  createMawbDocument: boolean;
  destinationAirport?: string | null;
  destinationIata?: string | null;
  existingMawb?: {
    consigneeAddress?: string | null;
    consigneeName?: string | null;
    destinationAirport?: string | null;
    destinationIata?: string | null;
    originIata?: string | null;
  } | null;
  mawb?: string | null;
  mawbConsigneeAddress?: string | null;
  mawbConsigneeName?: string | null;
  originIata?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasMawb(value: unknown) {
  return clean(value).length > 0;
}

export function resolveRouteOriginFromMawbIata(iataCode: unknown) {
  const normalized = clean(iataCode).toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) return "";
  const airport = resolveAirportByIata(normalized);
  return airport?.city || airport?.country || resolveMawbDepartureAirport(normalized) || normalized;
}

export function buildGuidedMawbRouteDefaults(
  source: GuidedMawbRouteDefaultSource,
): GuidedMawbRouteDefaults {
  if (!source.createMawbDocument || !hasMawb(source.mawb)) {
    return { destination: "", origin: "", receiverAddress: "", receiverName: "" };
  }

  const originIata = clean(source.originIata || source.existingMawb?.originIata).toUpperCase();
  const destinationIata = clean(
    source.destinationIata || source.existingMawb?.destinationIata,
  ).toUpperCase();
  const manualDestination = clean(source.destinationAirport || source.existingMawb?.destinationAirport);

  return {
    destination: resolveMawbDestinationDisplay(destinationIata, manualDestination) || "",
    origin: resolveRouteOriginFromMawbIata(originIata),
    receiverAddress: clean(source.mawbConsigneeAddress || source.existingMawb?.consigneeAddress),
    receiverName: clean(source.mawbConsigneeName || source.existingMawb?.consigneeName),
  };
}
