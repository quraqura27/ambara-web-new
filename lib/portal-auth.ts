import { createHmac, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "ambara_portal_token";

export type PortalUser = {
  email: string;
  id: number;
  name: string;
  role: string;
};

type TokenPayload = PortalUser & {
  exp: number;
  iat: number;
};

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function signInput(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest();
}

export function createPortalToken(user: PortalUser) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ ...user, iat: now, exp: now + 60 * 60 * 8 }));
  const signature = base64UrlEncode(signInput(`${header}.${payload}`, secret));

  return `${header}.${payload}.${signature}`;
}

export function verifyPortalToken(token: string): PortalUser | null {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  const [header, payload, signature, extra] = token.split(".");
  if (!header || !payload || !signature || extra) {
    return null;
  }

  const expectedSignature = signInput(`${header}.${payload}`, secret);
  const actualSignature = Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as TokenPayload;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: decoded.email,
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function setPortalSession(user: PortalUser) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createPortalToken(user), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getPortalUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? verifyPortalToken(token) : null;
}

export async function requirePortalUser() {
  const user = await getPortalUser();
  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
