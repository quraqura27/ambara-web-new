export const invoiceCurrencies = ["IDR", "USD", "JPY"] as const;

export type InvoiceCurrency = (typeof invoiceCurrencies)[number];

export const invoiceStoredStatuses = ["draft", "sent", "paid", "archived", "voided"] as const;

export type InvoiceStoredStatus = (typeof invoiceStoredStatuses)[number];

export const invoiceEffectiveStatuses = [...invoiceStoredStatuses, "overdue"] as const;

export type InvoiceEffectiveStatus = (typeof invoiceEffectiveStatuses)[number];

export const FULL_PAYMENT_TERMS_TEXT =
  "Payment should be made in full amount as stated in the invoice. Any bank charges or withholding tax shall be borne by the customer unless agreed otherwise.";

export type InvoiceLineInput = {
  chargeableWeight?: number | string | null;
  flatAmount?: number | string | null;
  lineTotal?: number | string | null;
  pricePerKg?: number | string | null;
  type: "awb" | "service";
};

export type InvoiceDeductionInput = {
  amount?: number | string | null;
};

export type InvoiceCalculationInput = {
  deductions?: InvoiceDeductionInput[];
  depositAmount?: number | string | null;
  lines: InvoiceLineInput[];
  pphBaseAmount?: number | string | null;
  pphEnabled?: boolean;
  pphRate?: number | string | null;
  vatEnabled?: boolean;
  vatRate?: number | string | null;
};

export type InvoiceTotals = {
  amountDue: number;
  depositAmount: number;
  netAmount: number;
  netPayable: number;
  pphAmount: number;
  pphBaseAmount: number;
  pphRate: number;
  subtotal: number;
  total: number;
  totalPengurangan: number;
  vatAmount: number;
  vatRate: number;
};

const companyPrefixes = new Set([
  "CV",
  "INC",
  "LTD",
  "PERSERO",
  "PT",
  "TBK",
]);

export function numberValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== "string") {
    return 0;
  }
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function shouldPrintTermsOfPayment(input: {
  pphAmount?: number | string | null;
  showPaymentTerms?: boolean | null;
}) {
  return input.showPaymentTerms === true && numberValue(input.pphAmount) <= 0;
}

function isOneOf<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return (values as readonly string[]).includes(value);
}

export function normalizeInvoiceStatus(value: unknown): InvoiceStoredStatus {
  if (typeof value !== "string") return "sent";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "finalized") return "sent";
  return isOneOf(invoiceStoredStatuses, normalized) ? normalized : "sent";
}

export function isInvoiceEffectiveStatus(value: string): value is InvoiceEffectiveStatus {
  return isOneOf(invoiceEffectiveStatuses, value);
}

export function isInvoiceStoredStatus(value: string): value is InvoiceStoredStatus {
  return isOneOf(invoiceStoredStatuses, value);
}

export function dateInputFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function invoiceEffectiveStatus(
  input: {
    dueDate?: string | null;
    paidAt?: Date | string | null;
    status?: string | null;
  },
  today = dateInputFromDate(new Date()),
): InvoiceEffectiveStatus {
  const status = normalizeInvoiceStatus(input.status);
  if (status === "sent" && !input.paidAt && input.dueDate && input.dueDate < today) {
    return "overdue";
  }
  return status;
}

export function invoiceStatusLabel(status: InvoiceEffectiveStatus | InvoiceStoredStatus | string) {
  const normalized = isInvoiceEffectiveStatus(status) ? status : invoiceEffectiveStatus({ status });
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function invoiceBlocksLineReuse(status: unknown) {
  return normalizeInvoiceStatus(status) !== "voided";
}

export function money(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function lineTotal(line: InvoiceLineInput) {
  if (line.type === "awb") {
    return money(numberValue(line.chargeableWeight) * numberValue(line.pricePerKg));
  }
  return money(numberValue(line.flatAmount ?? line.lineTotal));
}

export function calculateInvoiceTotals(input: InvoiceCalculationInput): InvoiceTotals {
  const subtotal = money(input.lines.reduce((sum, line) => sum + lineTotal(line), 0));
  const totalPengurangan = money(
    (input.deductions ?? []).reduce((sum, deduction) => sum + numberValue(deduction.amount), 0),
  );
  const netAmount = money(subtotal - totalPengurangan);
  const vatRate = numberValue(input.vatRate ?? 1.1);
  const vatAmount = input.vatEnabled ? money((netAmount * vatRate) / 100) : 0;
  const total = money(netAmount + vatAmount);
  const depositAmount = money(numberValue(input.depositAmount));
  const amountDue = money(total - depositAmount);
  const pphRate = numberValue(input.pphRate ?? 2);
  const pphBaseAmount = input.pphEnabled
    ? money(numberValue(input.pphBaseAmount ?? netAmount))
    : 0;
  const pphAmount = input.pphEnabled ? money((pphBaseAmount * pphRate) / 100) : 0;

  return {
    amountDue,
    depositAmount,
    netAmount,
    netPayable: money(amountDue - pphAmount),
    pphAmount,
    pphBaseAmount,
    pphRate,
    subtotal,
    total,
    totalPengurangan,
    vatAmount,
    vatRate,
  };
}

export function normalizeCustomerCode(value: string) {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
  return normalized.length === 3 ? normalized : "";
}

export function deriveCustomerCode(name: string | null | undefined) {
  const words = (name ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !companyPrefixes.has(word));

  const initials = words.map((word) => word[0]).join("");
  const compact = words.join("");
  return normalizeCustomerCode(initials.length >= 3 ? initials : compact);
}

export function formatInvoiceNumber(input: {
  customerCode: string;
  sequence: number;
  year: number;
}) {
  const customerCode = normalizeCustomerCode(input.customerCode);
  if (!customerCode) throw new Error("Customer code must be exactly 3 letters.");
  const yearSuffix = String(input.year).slice(-2);
  return `AAG/${String(input.sequence).padStart(3, "0")}/${customerCode}/${yearSuffix}`;
}

export function invoiceSequenceFromNumber(invoiceNumber: string | null | undefined) {
  const match = (invoiceNumber ?? "").match(/^AAG\/(\d{1,})\//i);
  return match?.[1] ? match[1].padStart(3, "0") : "000";
}

export function buildInvoicePdfFilename(input: {
  customerCode?: string | null;
  customerName?: string | null;
  invoiceDate?: string | null;
  invoiceNumber?: string | null;
}) {
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(input.invoiceDate ?? "")
    ? (input.invoiceDate ?? "").replace(/-/g, "")
    : "00000000";
  const customerCode =
    normalizeCustomerCode(input.customerCode ?? "") ||
    deriveCustomerCode(input.customerName) ||
    "CUS";
  const sequence = invoiceSequenceFromNumber(input.invoiceNumber);
  return `${datePart}_${customerCode}_${sequence}.pdf`;
}

export function formatCurrencyAmount(value: number | string | null | undefined, currency = "IDR") {
  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(numberValue(value));
}

const smallNumbers = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

export function terbilangRupiah(value: number | string | null | undefined): string {
  const amount = Math.floor(Math.abs(numberValue(value)));
  if (amount === 0) return "nol rupiah";

  function words(n: number): string {
    if (n < 12) return smallNumbers[n] ?? "";
    if (n < 20) return `${words(n - 10)} belas`;
    if (n < 100) return `${words(Math.floor(n / 10))} puluh ${words(n % 10)}`.trim();
    if (n < 200) return `seratus ${words(n - 100)}`.trim();
    if (n < 1000) return `${words(Math.floor(n / 100))} ratus ${words(n % 100)}`.trim();
    if (n < 2000) return `seribu ${words(n - 1000)}`.trim();
    if (n < 1_000_000) return `${words(Math.floor(n / 1000))} ribu ${words(n % 1000)}`.trim();
    if (n < 1_000_000_000) return `${words(Math.floor(n / 1_000_000))} juta ${words(n % 1_000_000)}`.trim();
    if (n < 1_000_000_000_000) return `${words(Math.floor(n / 1_000_000_000))} miliar ${words(n % 1_000_000_000)}`.trim();
    return `${words(Math.floor(n / 1_000_000_000_000))} triliun ${words(n % 1_000_000_000_000)}`.trim();
  }

  return `${words(amount).replace(/\s+/g, " ")} rupiah`;
}
