export const shipmentDocumentTypes = [
  "commercial_invoice",
  "packing_list",
  "mawb",
  "hawb",
  "customs",
  "permit",
  "pod",
  "other",
] as const;

export type ShipmentDocumentType = (typeof shipmentDocumentTypes)[number];

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export function sanitizeDocumentFileName(value: string) {
  const cleaned = value.normalize("NFKC").replace(/[\\/\0\r\n]/g, "-").replace(/\s+/g, " ").trim();
  return (cleaned || "document").slice(0, 180);
}

function matchesMagicBytes(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (mimeType === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

export function validateDocumentFile(input: { bytes: Uint8Array; fileName: string; mimeType: string; size: number }) {
  if (!allowedMimeTypes.has(input.mimeType)) throw new Error("Upload a PDF, JPEG, or PNG document.");
  if (input.size <= 0) throw new Error("The selected document is empty.");
  if (input.size > 8 * 1024 * 1024) throw new Error("Documents must be 8 MB or smaller.");
  if (!matchesMagicBytes(input.bytes, input.mimeType)) throw new Error("The document contents do not match the selected file type.");
  return { fileName: sanitizeDocumentFileName(input.fileName), mimeType: input.mimeType };
}
