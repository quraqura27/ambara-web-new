import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actions = readFileSync(new URL("../../actions/invoices.ts", import.meta.url), "utf8");
const detailPage = readFileSync(
  new URL("../../app/(portal)/invoices/[id]/page.tsx", import.meta.url),
  "utf8",
);
const editPage = readFileSync(
  new URL("../../app/(portal)/invoices/[id]/edit/page.tsx", import.meta.url),
  "utf8",
);
const editor = readFileSync(
  new URL("../../components/invoices/invoice-draft-charge-editor.tsx", import.meta.url),
  "utf8",
);
const portalError = readFileSync(
  new URL("../../app/(portal)/error.tsx", import.meta.url),
  "utf8",
);

test("draft invoice detail exposes editing and blocks incomplete charges before submission", () => {
  assert.match(detailPage, /href={`\/invoices\/\$\{invoice\.id\}\/edit`}/);
  assert.match(detailPage, /draftSendIssue/);
  assert.match(detailPage, /disabled={Boolean\(draftSendIssue\)}/);
  assert.match(detailPage, /needs a positive quantity and rate/);
});

test("draft charge editor returns validation inline and preserves linked references", () => {
  assert.match(editPage, /getInvoiceDraftChargeEditorData\(id\)/);
  assert.match(editPage, /if \(!editor\) notFound\(\)/);
  assert.match(editor, /useActionState\(action, initialState\)/);
  assert.match(editor, /state\.formError/);
  assert.match(editor, /linked shipment references, and linked quantities stay fixed/i);
  assert.match(editor, /Save draft changes/);
});

test("draft charge updates are authorized, draft-only, atomic, and audited", () => {
  const updateAction = actions.slice(
    actions.indexOf("export async function updateInvoiceDraftChargesFromForm"),
    actions.indexOf("export async function markDraftInvoiceSentFromForm"),
  );
  assert.match(updateAction, /await requireInvoiceUser\(\)/);
  assert.match(updateAction, /Only draft invoices can be edited\./);
  assert.match(updateAction, /for update/);
  assert.match(updateAction, /await db\.batch/);
  assert.match(updateAction, /invoice\.draft_charges_updated/);
  assert.match(updateAction, /eq\(invoiceLineItems\.invoiceId, id\)/);
  assert.match(updateAction, /billing basis is fixed by its linked shipment/);
  assert.match(updateAction, /pphRate: invoice\.pphRate/);
  assert.match(updateAction, /vatRate: invoice\.vatRate/);
});

test("portal error boundary no longer labels every failure as a database outage", () => {
  assert.doesNotMatch(portalError, /database connection recovers/i);
  assert.match(portalError, /unexpected server error/i);
});
