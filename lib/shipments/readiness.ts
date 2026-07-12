export const shipmentOperationalStages = [
  "intake",
  "booking",
  "pickup",
  "origin_handling",
  "flight_ready",
  "in_transit",
  "customs_review",
  "destination_handling",
  "last_mile",
  "completed",
  "on_hold",
] as const;

export type ShipmentOperationalStage = (typeof shipmentOperationalStages)[number];

export const documentReadinessValues = ["not_ready", "collecting", "review", "ready", "exception"] as const;
export type DocumentReadiness = (typeof documentReadinessValues)[number];

export const clearanceModeValues = ["not_required", "consignee", "broker", "ambara_coordination"] as const;
export const incotermValues = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"] as const;
export const cargoRiskValues = [
  "dangerous_goods",
  "battery",
  "perishable",
  "fragile",
  "temperature_controlled",
  "high_value",
  "restricted",
  "oversized",
] as const;

export type CargoRisk = (typeof cargoRiskValues)[number];

export type ShipmentPackageInput = {
  grossWeightKg: number | null;
  heightCm: number;
  lengthCm: number;
  packageNumber: number;
  pieces: number;
  widthCm: number;
};

function positiveNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be a positive number.`);
  return number;
}

export function calculateVolumetricWeightKg(input: Pick<ShipmentPackageInput, "heightCm" | "lengthCm" | "pieces" | "widthCm">) {
  return Math.round(((input.lengthCm * input.widthCm * input.heightCm * input.pieces) / 6000) * 100) / 100;
}

export function parseShipmentPackages(value: string): ShipmentPackageInput[] {
  if (!value.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Package dimensions are invalid. Reload the page and try again.");
  }
  if (!Array.isArray(parsed) || parsed.length > 50) throw new Error("Package dimensions must contain 50 rows or fewer.");

  return parsed.map((row, index) => {
    if (!row || typeof row !== "object") throw new Error(`Package ${index + 1} is invalid.`);
    const input = row as Record<string, unknown>;
    const pieces = positiveNumber(input.pieces, `Package ${index + 1} pieces`);
    if (!Number.isInteger(pieces)) throw new Error(`Package ${index + 1} pieces must be a whole number.`);
    const grossWeight = input.grossWeightKg === "" || input.grossWeightKg == null
      ? null
      : positiveNumber(input.grossWeightKg, `Package ${index + 1} gross weight`);
    return {
      grossWeightKg: grossWeight,
      heightCm: positiveNumber(input.heightCm, `Package ${index + 1} height`),
      lengthCm: positiveNumber(input.lengthCm, `Package ${index + 1} length`),
      packageNumber: index + 1,
      pieces,
      widthCm: positiveNumber(input.widthCm, `Package ${index + 1} width`),
    };
  });
}

export function normalizeCargoRisks(values: string[]) {
  return [...new Set(values.filter((value): value is CargoRisk => cargoRiskValues.includes(value as CargoRisk)))];
}

export function parseWibDateTime(value: string) {
  if (!value.trim()) return null;
  const parsed = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}:00+07:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid WIB date and time.");
  return parsed;
}
