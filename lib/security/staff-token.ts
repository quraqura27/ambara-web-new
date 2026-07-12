import { createHmac, timingSafeEqual } from "node:crypto";

export const STAFF_TOKEN_ISSUER = "ambara-portal";
export const STAFF_TOKEN_AUDIENCE = "ambara-staff-api";

export type StaffTokenIdentity = {
  email: string;
  id: number;
  name: string;
  role: string;
  sessionVersion: number;
};

export type StaffTokenClaims = StaffTokenIdentity & {
  aud: typeof STAFF_TOKEN_AUDIENCE;
  exp: number;
  iat: number;
  iss: typeof STAFF_TOKEN_ISSUER;
  sub: string;
};

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function signInput(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest();
}

export function createStaffToken(
  identity: StaffTokenIdentity,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!secret.trim()) throw new Error("Staff token signing secret is required");
  if (!Number.isInteger(identity.id)) throw new Error("A valid staff subject is required");
  if (!identity.email.trim() || !identity.name.trim() || !identity.role.trim()) {
    throw new Error("Staff identity claims are required");
  }
  if (!Number.isInteger(identity.sessionVersion) || identity.sessionVersion < 1) {
    throw new Error("Staff sessionVersion must be a positive integer");
  }

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({
    ...identity,
    aud: STAFF_TOKEN_AUDIENCE,
    exp: nowSeconds + 60 * 60 * 8,
    iat: nowSeconds,
    iss: STAFF_TOKEN_ISSUER,
    sub: String(identity.id),
  } satisfies StaffTokenClaims));
  const signature = base64UrlEncode(signInput(`${header}.${payload}`, secret));
  return `${header}.${payload}.${signature}`;
}

export function verifyStaffToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): StaffTokenClaims | null {
  if (!token || !secret.trim()) return null;
  const [header, payload, signature, extra] = token.split(".");
  if (!header || !payload || !signature || extra) return null;

  const expectedSignature = signInput(`${header}.${payload}`, secret);
  const actualSignature = Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
    return null;
  }

  try {
    const decodedHeader = JSON.parse(base64UrlDecode(header)) as { alg?: string; typ?: string };
    const decoded = JSON.parse(base64UrlDecode(payload)) as StaffTokenClaims;
    if (
      decodedHeader.alg !== "HS256" ||
      decodedHeader.typ !== "JWT" ||
      decoded.iss !== STAFF_TOKEN_ISSUER ||
      decoded.aud !== STAFF_TOKEN_AUDIENCE ||
      decoded.sub !== String(decoded.id) ||
      !Number.isInteger(decoded.id) ||
      typeof decoded.role !== "string" ||
      !decoded.role.trim() ||
      typeof decoded.email !== "string" ||
      !decoded.email.trim() ||
      typeof decoded.name !== "string" ||
      !decoded.name.trim() ||
      !Number.isInteger(decoded.sessionVersion) ||
      decoded.sessionVersion < 1 ||
      !Number.isInteger(decoded.iat) ||
      decoded.iat > nowSeconds + 60 ||
      !Number.isInteger(decoded.exp) ||
      decoded.exp <= nowSeconds
    ) return null;
    return decoded;
  } catch {
    return null;
  }
}
