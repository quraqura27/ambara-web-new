import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

function functionSource(source: string, name: string, nextName?: string) {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = nextName ? source.indexOf(`export async function ${nextName}`, start + 1) : source.length;
  return source.slice(start, end === -1 ? source.length : end);
}

test("native staff sessions are database validated and administratively revocable", () => {
  const auth = read("lib/portal-auth.ts");
  const accounts = read("actions/staff-accounts.ts");
  assert.match(auth, /staff\.sessionVersion !== claims\.sessionVersion/);
  assert.match(auth, /!staff\?\.isActive/);
  assert.match(accounts, /sessionVersion: sql`\$\{staffAccounts\.sessionVersion\} \+ 1`/);
  assert.match(accounts, /revokeStaffSessions/);
});

test("multi-record shipment and delivery mutations use atomic database batches", () => {
  const shipments = read("actions/shipments.ts");
  const vendor = read("actions/vendor-tracking.ts");
  const createShipment = functionSource(shipments, "createShipmentFromForm", "getCustomersForSelect");
  assert.match(createShipment, /pg_get_serial_sequence\('shipments'/);
  assert.match(createShipment, /await db\.batch\(/);
  assert.match(createShipment, /shipment\.created/);

  [
    ["createDeliveryBatchFromForm", "getDeliveryBatchDashboard"],
    ["commitVendorTrackingImport", "bulkUpdateBatchStatusFromForm"],
    ["bulkUpdateBatchStatusFromForm", "previewVendorStatusUpdate"],
    ["commitVendorStatusUpdate", "markBatchCheckedNoChange"],
  ].forEach(([name, nextName]) => {
    const block = functionSource(vendor, name!, nextName);
    assert.match(block, /await db\.batch\(/, name);
  });
  assert.match(vendor, /No shipment records were changed/);
  assert.match(vendor, /No delivery records were changed/);
});

test("database and object-storage failures have recovery paths", () => {
  const routeError = read("app/(portal)/error.tsx");
  const globalError = read("app/global-error.tsx");
  const documents = read("actions/documents.ts");
  assert.match(routeError, /onClick=\{reset\}/);
  assert.match(routeError, /role="alert"/);
  assert.match(globalError, /onClick=\{reset\}/);
  assert.match(documents, /DeleteObjectCommand/);
  assert.match(documents, /catch \(error\)/);
});

test("server validation retains entered form values", () => {
  const customerForm = read("components/portal/customer-form.tsx");
  const customerAction = read("actions/customers.ts");
  const guidedForm = read("components/portal/guided-shipment-form.tsx");
  assert.match(customerForm, /useActionState/);
  assert.match(customerForm, /state\.values \?\? values/);
  assert.match(customerAction, /values: Object\.fromEntries\(formData\)/);
  assert.match(guidedForm, /state\.values/);
});

test("destructive dialogs support keyboard containment and focus restoration", () => {
  const dialogs = read("components/portal/confirm-submit-button.tsx");
  assert.match(dialogs, /aria-modal="true"/);
  assert.match(dialogs, /role="dialog"/);
  assert.match(dialogs, /event\.key === "Escape"/);
  assert.match(dialogs, /event\.key !== "Tab"/);
  assert.match(dialogs, /previousFocus\?\.focus\(\)/);
  assert.match(dialogs, /data-dialog-initial/);
});

test("high-density workflows have mobile cards and desktop tables", () => {
  [
    "app/(portal)/shipments/page.tsx",
    "app/(portal)/operations/page.tsx",
    "app/(portal)/quotes/page.tsx",
    "app/(portal)/documents/page.tsx",
    "app/(portal)/customers/page.tsx",
    "app/(portal)/delivery-batches/page.tsx",
    "app/(portal)/invoices/page.tsx",
    "app/(portal)/invoices/collections/page.tsx",
    "app/(portal)/mawbs/page.tsx",
  ].forEach((path) => {
    const source = read(path);
    assert.match(source, /md:hidden/, path);
    assert.match(source, /hidden overflow-x-auto[^\"]*md:block/, path);
  });
});

test("invoice lifecycle labels manual delivery truthfully and confirms destructive changes", () => {
  const actions = read("actions/invoices.ts");
  const detail = read("app/(portal)/invoices/[id]/page.tsx");
  const builder = read("components/invoices/invoice-builder.tsx");
  assert.match(actions, /markDraftInvoiceSentFromForm/);
  assert.match(actions, /external_or_manual/);
  assert.match(actions, /paymentReference/);
  assert.match(detail, /Mark as sent/);
  assert.match(detail, /confirmText="MARK SENT"/);
  assert.doesNotMatch(builder, />Send Invoice</);
});

test("legacy staff APIs are retired and the client session is HttpOnly", () => {
  const dispatcher = read("server/legacy-api/lib/dispatcher.js");
  const policy = read("server/legacy-api/lib/access-policy.js");
  const clientApi = read("server/legacy-api/handlers/client-api.js");
  const clientPage = read("public/client.html");
  assert.doesNotMatch(dispatcher, /handlers\/(auth|awbs|customers|documents|quotes|shipments|v1-)/);
  assert.match(policy, /legacy staff API is retired/i);
  assert.match(clientApi, /HttpOnly/);
  assert.match(clientApi, /CLIENT_JWT_SECRET|signClientToken/);
  assert.doesNotMatch(clientPage, /localStorage/);
  assert.doesNotMatch(clientPage, /Authorization/);
  assert.match(clientPage, /escapeHtml/);
});

test("customer credentials moved to an audited native capability boundary", () => {
  const customers = read("actions/customers.ts");
  const customerPage = read("app/(portal)/customers/[id]/page.tsx");
  const clientApi = read("server/legacy-api/handlers/client-api.js");
  const policy = read("server/legacy-api/lib/access-policy.js");
  assert.match(customers, /hasPortalCapability\(user, "customer:credentials"\)/);
  assert.match(customers, /session_version = \$\{customers\.sessionVersion\} \+ 1/);
  assert.match(customers, /customer\.credentials_reset/);
  assert.match(customerPage, /canManageCredentials/);
  assert.doesNotMatch(clientApi, /action === 'set-password'/);
  assert.match(policy, /Legacy customer credential management is retired/);
  assert.match(clientApi, /catch \{ return \{ \.\.\.doc, file_url: null \}; \}/);
});
