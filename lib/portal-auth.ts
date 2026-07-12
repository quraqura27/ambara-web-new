import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { staffAccounts } from "@/lib/db/schema";
import {
  hasPortalCapability,
  isPortalRole,
  normalizePortalRole,
  type PortalCapability,
  type PortalRole,
} from "@/lib/portal-roles";
import {
  createStaffToken,
  STAFF_TOKEN_AUDIENCE,
  STAFF_TOKEN_ISSUER,
  verifyStaffToken,
} from "@/lib/security/staff-token";

const COOKIE_NAME = "ambara_portal_token";
const LOCAL_DEV_USER_ID = -1;
export { STAFF_TOKEN_AUDIENCE, STAFF_TOKEN_ISSUER };

export type PortalUser = {
  email: string;
  id: number;
  name: string;
  role: PortalRole;
  sessionVersion: number;
};

export function isLocalPortalDevAccessEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.LOCAL_PORTAL_DEV_ACCESS === "true";
}

export function getLocalPortalDevUser(): PortalUser {
  return {
    email: (process.env.LOCAL_PORTAL_DEV_EMAIL || "local@ambara.test").trim().toLowerCase(),
    id: LOCAL_DEV_USER_ID,
    name: process.env.LOCAL_PORTAL_DEV_NAME || "Local Portal Tester",
    role: normalizePortalRole(process.env.LOCAL_PORTAL_DEV_ROLE || "superadmin"),
    sessionVersion: 1,
  };
}

function getStaffJwtSecret() {
  return process.env.STAFF_JWT_SECRET;
}

export function createPortalToken(user: PortalUser) {
  const secret = getStaffJwtSecret();
  if (!secret) throw new Error("STAFF_JWT_SECRET is not configured");
  if (!isPortalRole(user.role)) throw new Error("A valid staff role is required");
  return createStaffToken(user, secret);
}

export function verifyPortalToken(token: string): PortalUser | null {
  const secret = getStaffJwtSecret();
  if (!secret) return null;
  const decoded = verifyStaffToken(token, secret);
  if (!decoded || !isPortalRole(decoded.role)) return null;
  return {
    email: decoded.email,
    id: decoded.id,
    name: decoded.name,
    role: decoded.role,
    sessionVersion: decoded.sessionVersion,
  };
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

export async function getPortalUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return isLocalPortalDevAccessEnabled() ? getLocalPortalDevUser() : null;

  const claims = verifyPortalToken(token);
  if (!claims) return null;

  const localDevUser = getLocalPortalDevUser();
  if (
    isLocalPortalDevAccessEnabled() &&
    claims.id === localDevUser.id &&
    claims.email === localDevUser.email
  ) return localDevUser;

  try {
    const [staff] = await db
      .select({
        email: staffAccounts.email,
        fullName: staffAccounts.fullName,
        id: staffAccounts.id,
        isActive: staffAccounts.isActive,
        role: staffAccounts.role,
        sessionVersion: staffAccounts.sessionVersion,
      })
      .from(staffAccounts)
      .where(eq(staffAccounts.id, claims.id))
      .limit(1);

    if (
      !staff?.isActive ||
      staff.email.trim().toLowerCase() !== claims.email.trim().toLowerCase() ||
      staff.sessionVersion !== claims.sessionVersion ||
      !isPortalRole(staff.role)
    ) return null;

    return {
      email: staff.email,
      id: staff.id,
      name: staff.fullName,
      role: staff.role,
      sessionVersion: staff.sessionVersion,
    };
  } catch (error) {
    console.error("Portal session validation failed:", error);
    return null;
  }
}

export async function requirePortalUser() {
  const user = await getPortalUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requirePortalCapability(capability: PortalCapability) {
  const user = await requirePortalUser();
  if (!hasPortalCapability(user, capability)) redirect("/dashboard?error=forbidden");
  return user;
}
