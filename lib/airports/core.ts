import airportReferencesJson from "./ourairports-iata.json" with { type: "json" };

export type AirportReference = {
  airportName: string;
  city: string;
  country: string;
  iata: string;
  scheduledService?: boolean;
  type?: string;
};

const airportReferences = airportReferencesJson as readonly AirportReference[];
const airportByIata = new Map(airportReferences.map((airport) => [airport.iata, airport]));

const destinationDisplayOverrides: Record<string, string> = {
  CGK: "Indonesia",
  DMK: "Bangkok",
  KUL: "Kuala Lumpur",
  TPE: "Taiwan",
};

export function normalizeAirportIata(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function resolveAirportByIata(iataCode: unknown): AirportReference | null {
  const normalized = normalizeAirportIata(iataCode);
  if (!/^[A-Z]{3}$/.test(normalized)) return null;
  return airportByIata.get(normalized) ?? null;
}

export function resolveMawbDepartureAirport(iataCode: unknown) {
  const airport = resolveAirportByIata(iataCode);
  return airport?.airportName ?? null;
}

export function resolveMawbDestinationDisplay(iataCode: unknown, manualDisplayName?: unknown) {
  const normalized = normalizeAirportIata(iataCode);
  const airport = resolveAirportByIata(normalized);
  const manual = String(manualDisplayName ?? "").trim();
  if (!airport) return manual || null;
  return destinationDisplayOverrides[normalized] ?? (
    airport.city ||
    airport.country ||
    airport.airportName
  );
}

export function needsManualDestinationAirport(iataCode: unknown) {
  const normalized = normalizeAirportIata(iataCode);
  return /^[A-Z]{3}$/.test(normalized) && !resolveAirportByIata(normalized);
}

export function airportReferenceOptions() {
  return airportReferences.map((airport) => ({ ...airport }));
}
