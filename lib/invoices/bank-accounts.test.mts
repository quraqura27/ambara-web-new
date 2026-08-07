import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvoiceBankAccount,
  normalizeInvoiceBankAccountCode,
} from "./bank-accounts.ts";

test("resolves BCA invoice bank account details", () => {
  const bank = getInvoiceBankAccount("BCA");

  assert.equal(bank.title, "Bank BCA");
  assert.equal(bank.swift, "CENAIDJAXXX");
  assert.equal(bank.branch, "KCP Citra Raya");
  assert.equal(bank.name, "QURAISY ADBURRAHMAN");
  assert.equal(bank.accountNo, "7642412356");
});

test("resolves the PT Ambara Bank Mandiri account details", () => {
  const bank = getInvoiceBankAccount("MANDIRI");

  assert.equal(bank.title, "Bank Mandiri");
  assert.equal(bank.swift, "BMRIIDJA");
  assert.equal(bank.branch, "KCP PHE Tower");
  assert.equal(bank.name, "PT AMBARA ARTHA GLOBALTRANS");
  assert.equal(bank.accountNo, "127-00-99797779");
});

test("normalizes invoice bank account codes", () => {
  assert.equal(normalizeInvoiceBankAccountCode(" bca "), "BCA");
  assert.equal(normalizeInvoiceBankAccountCode(undefined), "MANDIRI");
  assert.equal(normalizeInvoiceBankAccountCode("unknown"), "MANDIRI");
});
