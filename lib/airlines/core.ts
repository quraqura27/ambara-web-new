import airlineSnapshotJson from "./iata-member-airlines.json" with { type: "json" };
import manualAirlineOverridesJson from "./manual-airline-overrides.json" with { type: "json" };

export type AirlineReference = {
  country: string;
  iataDesignator: string;
  icaoCode: string;
  name: string;
  prefixCode: string;
};

type AirlineReferenceSnapshot = {
  records: AirlineReference[];
  snapshotDate: string;
  sourceScope: string;
  sourceUrl: string;
};

type AirlineReferenceOverrides = {
  records: AirlineReference[];
  sourceScope: string;
  sourceUrl: string;
  updatedAt: string;
};

export type ResolvedAirWaybill = {
  airlineName: string;
  airlineUnresolved: boolean;
  canonicalNumber: string;
  prefix: string;
};

export type ResolvedFlightLeg = {
  airlineDesignator: string;
  airlineName: string;
  airlineUnresolved: boolean;
  flightNumber: string;
  formattedNumber: string;
  operationalSuffix: string;
};

const airlineSnapshot = airlineSnapshotJson as AirlineReferenceSnapshot;
const manualAirlineOverrides = manualAirlineOverridesJson as AirlineReferenceOverrides;

export const airlineReferenceMetadata = {
  snapshotDate: airlineSnapshot.snapshotDate,
  sourceScope: airlineSnapshot.sourceScope,
  sourceUrl: airlineSnapshot.sourceUrl,
  manualOverrideCount: manualAirlineOverrides.records.length,
  manualOverrideUpdatedAt: manualAirlineOverrides.updatedAt,
} as const;

const manualAirlineReference = manualAirlineOverrides.records as readonly AirlineReference[];
const snapshotAirlineReference = airlineSnapshot.records as readonly AirlineReference[];

function hasManualOverrideFor(airline: AirlineReference) {
  return manualAirlineReference.some((manualAirline) => {
    const hasSamePrefix =
      Boolean(manualAirline.prefixCode) &&
      Boolean(airline.prefixCode) &&
      manualAirline.prefixCode === airline.prefixCode;
    const hasSameDesignator = manualAirline.iataDesignator === airline.iataDesignator;

    return hasSamePrefix || hasSameDesignator;
  });
}

export const airlineReference = [
  ...manualAirlineReference,
  ...snapshotAirlineReference.filter((airline) => !hasManualOverrideFor(airline)),
] as readonly AirlineReference[];

function normalizedCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function findAirlinesByPrefix(prefix: unknown) {
  const normalized = normalizedCode(prefix);
  if (!/^\d{3}$/.test(normalized)) return [];
  return airlineReference.filter((airline) => airline.prefixCode === normalized);
}

export function findAirlinesByDesignator(designator: unknown) {
  const normalized = normalizedCode(designator);
  if (!/^[A-Z0-9]{2}$/.test(normalized)) return [];
  return airlineReference.filter((airline) => airline.iataDesignator === normalized);
}

function resolveAirlineName(
  matches: readonly AirlineReference[],
  manualAirlineName: unknown,
  codeLabel: string,
) {
  const manualName = String(manualAirlineName ?? "").trim();

  if (matches.length === 1) {
    return {
      airlineName: matches[0]!.name,
      airlineUnresolved: false,
    };
  }

  if (!manualName) {
    throw new Error(
      matches.length > 1
        ? `Select the airline for ${codeLabel}.`
        : `Enter the airline name for unknown ${codeLabel}.`,
    );
  }

  if (
    matches.length > 1 &&
    !matches.some((airline) => airline.name.toLowerCase() === manualName.toLowerCase())
  ) {
    throw new Error(`Select one of the listed airlines for ${codeLabel}.`);
  }

  return {
    airlineName:
      matches.find((airline) => airline.name.toLowerCase() === manualName.toLowerCase())
        ?.name ?? manualName,
    airlineUnresolved: matches.length === 0,
  };
}

export function calculateAirWaybillCheckDigit(serialSevenDigits: string) {
  if (!/^\d{7}$/.test(serialSevenDigits)) {
    throw new Error("AWB serial must contain seven digits before the check digit.");
  }

  return String(Number.parseInt(serialSevenDigits, 10) % 7);
}

export function resolveAirWaybill(
  input: unknown,
  manualAirlineName?: unknown,
): ResolvedAirWaybill {
  const value = String(input ?? "").trim();
  const match = /^(\d{3})[\s-]?(\d{7,8})$/.exec(value);

  if (!match) {
    throw new Error("AWB must use a 3-digit prefix followed by 7 or 8 digits.");
  }

  const prefix = match[1]!;
  const enteredSerial = match[2]!;
  const serialSevenDigits = enteredSerial.slice(0, 7);
  const expectedCheckDigit = calculateAirWaybillCheckDigit(serialSevenDigits);

  if (enteredSerial.length === 8 && enteredSerial[7] !== expectedCheckDigit) {
    throw new Error(
      `AWB check digit is invalid. Expected ${expectedCheckDigit} for ${serialSevenDigits}.`,
    );
  }

  const fullSerial =
    enteredSerial.length === 7 ? `${enteredSerial}${expectedCheckDigit}` : enteredSerial;
  const airline = resolveAirlineName(
    findAirlinesByPrefix(prefix),
    manualAirlineName,
    `AWB prefix ${prefix}`,
  );

  return {
    ...airline,
    canonicalNumber: `${prefix}-${fullSerial}`,
    prefix,
  };
}

export function resolveFlightLeg(
  input: unknown,
  manualAirlineName?: unknown,
): ResolvedFlightLeg {
  const compact = normalizedCode(input).replace(/[\s-]+/g, "");
  const match = /^([A-Z0-9]{2})(\d{1,4})([A-Z]?)$/.exec(compact);

  if (!match) {
    throw new Error(
      "Flight number must contain a 2-character IATA airline code and 1 to 4 digits.",
    );
  }

  const airlineDesignator = match[1]!;
  const flightNumber = match[2]!;
  const operationalSuffix = match[3] ?? "";
  const airline = resolveAirlineName(
    findAirlinesByDesignator(airlineDesignator),
    manualAirlineName,
    `flight code ${airlineDesignator}`,
  );

  return {
    ...airline,
    airlineDesignator,
    flightNumber,
    formattedNumber: `${airlineDesignator}${flightNumber}${operationalSuffix}`,
    operationalSuffix,
  };
}

export function parseFlightLegsJson(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return [] as ResolvedFlightLeg[];

  let rows: unknown;
  try {
    rows = JSON.parse(text);
  } catch {
    throw new Error("Flight-leg data is invalid.");
  }

  if (!Array.isArray(rows)) {
    throw new Error("Flight-leg data is invalid.");
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        throw new Error("Flight-leg data is invalid.");
      }
      const candidate = row as { airlineName?: unknown; flightNumber?: unknown };
      const flightNumber = String(candidate.flightNumber ?? "").trim();
      if (!flightNumber) return null;
      return resolveFlightLeg(flightNumber, candidate.airlineName);
    })
    .filter((row): row is ResolvedFlightLeg => row !== null);
}
