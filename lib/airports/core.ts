export type AirportReference = {
  airportName: string;
  city: string;
  country: string;
  iata: string;
};

const airportReferences = [
  { airportName: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", iata: "CGK" },
  { airportName: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", iata: "KUL" },
  { airportName: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", iata: "TPE" },
  { airportName: "Don Mueang International Airport", city: "Bangkok", country: "Thailand", iata: "DMK" },
  { airportName: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", iata: "BKK" },
  { airportName: "Singapore Changi Airport", city: "Singapore", country: "Singapore", iata: "SIN" },
  { airportName: "Velana International Airport", city: "Male", country: "Maldives", iata: "MLE" },
  { airportName: "Mexico City International Airport", city: "Mexico City", country: "Mexico", iata: "MEX" },
  { airportName: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", iata: "HKG" },
  { airportName: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", iata: "CAN" },
  { airportName: "Incheon International Airport", city: "Seoul", country: "South Korea", iata: "ICN" },
  { airportName: "Narita International Airport", city: "Tokyo", country: "Japan", iata: "NRT" },
  { airportName: "Haneda Airport", city: "Tokyo", country: "Japan", iata: "HND" },
  { airportName: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", iata: "DXB" },
  { airportName: "Hamad International Airport", city: "Doha", country: "Qatar", iata: "DOH" },
  { airportName: "Istanbul Airport", city: "Istanbul", country: "Turkey", iata: "IST" },
  { airportName: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", iata: "AMS" },
  { airportName: "Frankfurt Airport", city: "Frankfurt", country: "Germany", iata: "FRA" },
  { airportName: "Heathrow Airport", city: "London", country: "United Kingdom", iata: "LHR" },
  { airportName: "Los Angeles International Airport", city: "Los Angeles", country: "United States", iata: "LAX" },
  { airportName: "John F. Kennedy International Airport", city: "New York", country: "United States", iata: "JFK" },
] as const satisfies readonly AirportReference[];

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
  return airportReferences.find((airport) => airport.iata === normalized) ?? null;
}

export function resolveMawbDepartureAirport(iataCode: unknown) {
  const airport = resolveAirportByIata(iataCode);
  return airport?.airportName ?? null;
}

export function resolveMawbDestinationDisplay(iataCode: unknown) {
  const normalized = normalizeAirportIata(iataCode);
  const airport = resolveAirportByIata(normalized);
  if (!airport) return null;
  return destinationDisplayOverrides[normalized] ?? (airport.city || airport.country || airport.airportName);
}

export function airportReferenceOptions() {
  return airportReferences.map((airport) => ({ ...airport }));
}
