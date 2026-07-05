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

test("normalizes invoice bank account codes", () => {
  assert.equal(normalizeInvoiceBankAccountCode(" bca "), "BCA");
  assert.equal(normalizeInvoiceBankAccountCode("unknown"), "OCBC");
});
