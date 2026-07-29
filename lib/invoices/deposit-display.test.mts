import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const detailPage = readFileSync(
  new URL("../../app/(portal)/invoices/[id]/page.tsx", import.meta.url),
  "utf8",
);
const printPage = readFileSync(
  new URL("../../app/(portal)/invoices/[id]/print/page.tsx", import.meta.url),
  "utf8",
);

function occurrenceCount(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

function assertConditionalDepositRow(source: string) {
  assert.equal(occurrenceCount(source, /numberValue\(invoice\.depositAmount\) > 0/g), 1);
  assert.equal(occurrenceCount(source, /label="Deposit"/g), 1);
  assert.equal(occurrenceCount(source, /negative value=\{invoice\.depositAmount\}/g), 1);
  assert.ok(source.indexOf('label="Deposit"') < source.indexOf('label="Total Due"'));
}

test("finance invoice detail conditionally shows the upfront deposit before total due", () => {
  const totals = detailPage.slice(
    detailPage.indexOf("<h2 className=\"mb-4 text-lg font-semibold\">Totals</h2>"),
    detailPage.indexOf("<span>Paid</span>"),
  );

  assert.equal(occurrenceCount(totals, /numberValue\(invoice\.depositAmount\) > 0/g), 1);
  assert.equal(occurrenceCount(totals, /label="Deposit"/g), 1);
  assert.equal(occurrenceCount(totals, /negative value=\{invoice\.depositAmount\}/g), 1);
  assert.ok(totals.indexOf('label="Deposit"') < totals.indexOf('label="Total due"'));
});

test("both invoice print formats conditionally show a negative deposit before total due", () => {
  const flexibleStart = printPage.indexOf('<table className="mt-8 w-full table-fixed');
  const legacyStart = printPage.indexOf('<table className="mt-8 w-full border-collapse text-[9.5pt]">');
  const summaryEnd = printPage.indexOf('<p className="mt-6 text-[8.5pt] italic">');

  assert.ok(flexibleStart >= 0 && legacyStart > flexibleStart && summaryEnd > legacyStart);
  assertConditionalDepositRow(printPage.slice(flexibleStart, legacyStart));
  assertConditionalDepositRow(printPage.slice(legacyStart, summaryEnd));
});
