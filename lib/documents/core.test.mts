import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeDocumentFileName, validateDocumentFile } from "./core.ts";

test("document names cannot escape their shipment storage prefix", () => {
  assert.equal(sanitizeDocumentFileName("../../packing\nlist.pdf"), "..-..-packing-list.pdf");
});

test("document validation checks MIME type, size, and magic bytes", () => {
  const result = validateDocumentFile({ bytes: new TextEncoder().encode("%PDF-1.7"), fileName: "invoice.pdf", mimeType: "application/pdf", size: 8 });
  assert.equal(result.mimeType, "application/pdf");
  assert.throws(() => validateDocumentFile({ bytes: new TextEncoder().encode("not a pdf"), fileName: "bad.pdf", mimeType: "application/pdf", size: 9 }), /contents/);
  assert.throws(() => validateDocumentFile({ bytes: new Uint8Array([1]), fileName: "script.html", mimeType: "text/html", size: 1 }), /PDF, JPEG, or PNG/);
});
