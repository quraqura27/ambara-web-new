import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actions = readFileSync(new URL("../../actions/invoices.ts", import.meta.url), "utf8");
const confirmationControls = readFileSync(
  new URL("../../components/portal/confirm-submit-button.tsx", import.meta.url),
  "utf8",
);
const core = readFileSync(new URL("./core.ts", import.meta.url), "utf8");
const pdfRoute = readFileSync(
  new URL("../../app/(portal)/invoices/[id]/pdf/route.ts", import.meta.url),
  "utf8",
);

test("payment actions authenticate Finance users and enforce submitted field rules", () => {
  assert.match(actions, /export async function recordInvoicePaymentFromForm/);
  assert.match(actions, /export async function voidInvoicePaymentFromForm/);
  assert.match(actions, /const user = await requireInvoiceUser\(\)/);
  assert.match(actions, /parseInvoicePaymentAmount\(text\(formData\.get\("amount"\)\)\)/);
  assert.match(actions, /parseInvoicePaymentDate\(text\(formData\.get\("paymentDate"\)\)\)/);
  assert.match(core, /Payment amount must be positive with no more than two decimal places\./);
  assert.match(core, /Payment date cannot be in the future\./);
  assert.match(actions, /Payment reference is required\./);
  assert.match(actions, /Payment void reason is required\./);
  assert.match(actions, /Draft invoices cannot receive payments|Send the invoice before recording a payment\./);
  assert.match(actions, /Voided invoices cannot receive payments\./);
  assert.match(actions, /Archived invoices cannot receive payments\./);
});

test("recording and voiding a payment atomically write their invoice audit events", () => {
  assert.match(
    actions,
    /with inserted_payment as \([\s\S]*insert into invoice_payments[\s\S]*inserted_audit as \([\s\S]*'invoice\.payment_recorded'/i,
  );
  assert.match(
    actions,
    /with voided_payment as \([\s\S]*update invoice_payments payment[\s\S]*inserted_audit as \([\s\S]*'invoice\.payment_voided'/i,
  );
  assert.match(actions, /voided_at = now\(\),[\s\S]*voided_by = \$\{user\.id\},[\s\S]*void_reason = \$\{reason\}/);
  assert.match(actions, /'reason', \$\{reason\}::text/);
});

test("confirmation controls submit current hidden values before closing their dialogs", () => {
  assert.doesNotMatch(confirmationControls, /requestAnimationFrame/);
  assert.equal(
    confirmationControls.match(/target\.requestSubmit\(\);\s+(?:setForm\(null\)|close\(\));/g)?.length,
    3,
  );
});

test("payment mutations revalidate list, detail, and collections views", () => {
  const recordAction = actions.slice(
    actions.indexOf("export async function recordInvoicePaymentFromForm"),
    actions.indexOf("export async function voidInvoicePaymentFromForm"),
  );
  const voidAction = actions.slice(
    actions.indexOf("export async function voidInvoicePaymentFromForm"),
    actions.indexOf("export async function archiveInvoiceFromForm"),
  );

  for (const source of [recordAction, voidAction]) {
    assert.match(source, /revalidatePath\("\/invoices"\)/);
    assert.match(source, /revalidatePath\("\/invoices\/collections"\)/);
    assert.match(source, /revalidatePath\(`\/invoices\/\$\{[^}]+\}`\)/);
  }
});

test("invoice voiding is blocked until active payments have been voided", () => {
  const invoiceVoidAction = actions.slice(
    actions.indexOf("export async function voidInvoiceFromForm"),
  );

  assert.match(invoiceVoidAction, /invoicePayments\.voidedAt\} is null/);
  assert.match(invoiceVoidAction, /Void active payments before voiding this invoice\./);
});

test("public verification exposes only a derived status, not payment history or references", () => {
  const publicVerification = actions.slice(
    actions.indexOf("export async function getPublicInvoiceVerification"),
    actions.indexOf("async function allocateInvoiceSequence"),
  );
  const returnedFields = publicVerification.slice(publicVerification.lastIndexOf("return {"));

  assert.match(publicVerification, /paymentState: paymentSummary\.paymentState/);
  assert.doesNotMatch(returnedFields, /\.\.\.invoice|payments|paidAmount|lastPaymentDate|paymentReference/);
});

test("issued PDF input remains isolated from payment ledger detail", () => {
  assert.match(
    pdfRoute,
    /generateInvoicePdf\(\{[\s\S]*deductions: detail\.deductions,[\s\S]*invoice: detail\.invoice,[\s\S]*lines: detail\.lines,/,
  );
  assert.doesNotMatch(pdfRoute, /detail\.payments|detail\.paymentSummary|\.\.\.detail/);
});
