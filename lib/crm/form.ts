import { randomUUID } from "node:crypto";

export function crmFormValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  const roles = formData.getAll("roles").filter((value): value is string => typeof value === "string");
  if (formData.has("roles") || formData.has("legalName")) values.roles = roles.join(",");
  return values;
}

export function crmActionError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  const safeDomainMessage = /^(?:Select |Enter |Set |A |An |The |This |Only |CRM |Quote request |Shipment |Legacy customer |Lead |Opportunity |Won |Lost |Move |Restore |Archive |Task |Company |Contact |You do not have access|legalName |countryCode |probability |currency |actionDueAt |readyDate |expectedCloseDate |weightKg |volumeCbm |numPackages )/;
  if (message && message.length <= 500 && safeDomainMessage.test(message)) return message;

  const reference = randomUUID().slice(0, 8);
  console.error("CRM action failed", {
    reference,
    errorName: error instanceof Error ? error.name : typeof error,
  });
  return `${fallback} Reference: ${reference}`;
}
