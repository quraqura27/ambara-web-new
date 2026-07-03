export type InvoiceFlightLeg = {
  airlineDesignator: string | null;
  flightNumber: string | null;
  operationalSuffix?: string | null;
};

export function formatInvoiceFlightNumber(
  legs: InvoiceFlightLeg[],
  fallback?: string | null,
) {
  const formatted = legs
    .map((leg) => {
      const designator = (leg.airlineDesignator ?? "").trim().toUpperCase();
      const number = (leg.flightNumber ?? "").trim().toUpperCase();
      const suffix = (leg.operationalSuffix ?? "").trim().toUpperCase();
      return number ? `${designator}${number}${suffix}` : "";
    })
    .filter(Boolean)
    .join("|");

  return formatted || (fallback ?? "").trim().toUpperCase() || null;
}
