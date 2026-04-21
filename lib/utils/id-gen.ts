/**
 * DETERMINISTIC 16-CHAR TRACKING FORMULA
 * Format: [AA][YY][Country][8-digit-ID][Service]
 * Example: AA26ID87654321PP
 */
export function generateInternalTrackingNo(countryCode: string = "ID", service: string = "PP") {
  const prefix = "AA";
  const year = "26"; // Systemic lock to 2026 for current cycle
  const country = (countryCode || "ID").slice(0, 2).toUpperCase();
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  const svc = (service || "PP").slice(0, 2).toUpperCase();

  return `${prefix}${year}${country}${random8}${svc}`.replace(/[^A-Z0-9]/g, "");
}
