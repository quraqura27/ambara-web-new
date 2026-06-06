import { timingSafeEqual } from "crypto";

export type SheetsSyncAuthError = {
  code: "SYNC_SECRET_NOT_CONFIGURED" | "SYNC_AUTH_MISSING" | "SYNC_AUTH_INVALID";
  message: string;
  status: number;
};

function cleanSecret(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function getProvidedSecret(headers: Headers) {
  const authorization = headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return headers.get("x-ambara-sync-secret")?.trim() ?? "";
}

function safeSecretEqual(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function getSheetsSyncAuthError(
  headers: Headers,
  configuredSecret = process.env.SHEETS_SYNC_SECRET,
): SheetsSyncAuthError | null {
  const expectedSecret = cleanSecret(configuredSecret);
  if (!expectedSecret) {
    return {
      code: "SYNC_SECRET_NOT_CONFIGURED",
      message: "Sheet sync secret is not configured",
      status: 500,
    };
  }

  const providedSecret = getProvidedSecret(headers);
  if (!providedSecret) {
    return {
      code: "SYNC_AUTH_MISSING",
      message: "Sheet sync authorization is required",
      status: 401,
    };
  }

  if (!safeSecretEqual(providedSecret, expectedSecret)) {
    return {
      code: "SYNC_AUTH_INVALID",
      message: "Sheet sync authorization is invalid",
      status: 401,
    };
  }

  return null;
}
