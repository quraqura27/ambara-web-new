import assert from "node:assert/strict";
import test from "node:test";

import { customerDuplicateSignals, normalizeCustomerPhone } from "./duplicates.ts";

test("customer duplicate matching normalizes Indonesian phone numbers", () => {
  assert.equal(normalizeCustomerPhone("0812-3456-7890"), "6281234567890");
  assert.deepEqual(customerDuplicateSignals(
    { companyName: "PT Example Logistik", email: "OPS@example.com", phone: "0812 3456 7890" },
    { companyName: "pt example-logistik", email: "ops@example.com", phone: "+62 812 3456 7890" },
  ), ["email", "phone", "company"]);
});
