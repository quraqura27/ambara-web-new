import { createHash, randomBytes } from "crypto";

export function createInvoiceVerificationToken() {
  return randomBytes(24).toString("base64url");
}

export function createInvoiceVerificationChecksum(input: {
  amount: number | string | null | undefined;
  invoiceNumber: string;
  token: string;
}) {
  return createHash("sha256")
    .update(`${input.invoiceNumber}|${input.amount ?? ""}|${input.token}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}
