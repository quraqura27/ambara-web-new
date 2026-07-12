export function normalizeCustomerEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeCustomerPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function normalizeCustomerName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

export function customerDuplicateSignals(input: { companyName: string; email: string; phone: string }, candidate: { companyName?: string | null; email?: string | null; phone?: string | null }) {
  const signals: string[] = [];
  if (input.email && normalizeCustomerEmail(input.email) === normalizeCustomerEmail(candidate.email || "")) signals.push("email");
  if (input.phone && normalizeCustomerPhone(input.phone) === normalizeCustomerPhone(candidate.phone || "")) signals.push("phone");
  if (input.companyName && normalizeCustomerName(input.companyName) === normalizeCustomerName(candidate.companyName || "")) signals.push("company");
  return signals;
}
