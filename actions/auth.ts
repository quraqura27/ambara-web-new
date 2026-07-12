"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { portalLoginAttempts, staffAccounts } from "@/lib/db/schema";
import { clearPortalSession, setPortalSession } from "@/lib/portal-auth";
import { isPortalRole } from "@/lib/portal-roles";
import {
  buildLoginThrottleKey,
  isLoginThrottleActive,
  loginThrottlePolicy,
} from "@/lib/security/login-throttle";

function normalize(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requestAddress() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function throttleKey(email: string) {
  const salt = process.env.AUTH_THROTTLE_SALT || process.env.STAFF_JWT_SECRET;
  if (!salt) throw new Error("AUTH_THROTTLE_SALT or STAFF_JWT_SECRET is required");
  return buildLoginThrottleKey(email, await requestAddress(), salt);
}

async function recordFailedLogin(key: string) {
  const now = new Date();
  await db.insert(portalLoginAttempts).values({
    attemptCount: 1,
    throttleKey: key,
    updatedAt: now,
    windowStartedAt: now,
  }).onConflictDoUpdate({
    target: portalLoginAttempts.throttleKey,
    set: {
      attemptCount: sql`case
        when ${portalLoginAttempts.windowStartedAt} < now() - (${loginThrottlePolicy.windowMinutes} * interval '1 minute') then 1
        else ${portalLoginAttempts.attemptCount} + 1
      end`,
      blockedUntil: sql`case
        when ${portalLoginAttempts.windowStartedAt} < now() - (${loginThrottlePolicy.windowMinutes} * interval '1 minute') then null
        when ${portalLoginAttempts.attemptCount} + 1 >= ${loginThrottlePolicy.maxAttempts}
          then now() + (${loginThrottlePolicy.blockMinutes} * interval '1 minute')
        else ${portalLoginAttempts.blockedUntil}
      end`,
      updatedAt: now,
      windowStartedAt: sql`case
        when ${portalLoginAttempts.windowStartedAt} < now() - (${loginThrottlePolicy.windowMinutes} * interval '1 minute') then now()
        else ${portalLoginAttempts.windowStartedAt}
      end`,
    },
  });
}

export async function signIn(formData: FormData) {
  const email = normalize(formData.get("email")).toLowerCase();
  const password = normalize(formData.get("password"));
  if (!email || !password) redirect("/sign-in?error=missing");

  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!process.env.STAFF_JWT_SECRET || !databaseUrl) redirect("/sign-in?error=config");

  let key: string;
  try {
    key = await throttleKey(email);
    const [throttle] = await db
      .select({ blockedUntil: portalLoginAttempts.blockedUntil })
      .from(portalLoginAttempts)
      .where(eq(portalLoginAttempts.throttleKey, key))
      .limit(1);
    if (isLoginThrottleActive(throttle?.blockedUntil)) redirect("/sign-in?error=throttled");
  } catch (error) {
    console.error("Portal sign-in throttle check failed:", error);
    redirect("/sign-in?error=server");
  }

  let staff;
  try {
    [staff] = await db
      .select()
      .from(staffAccounts)
      .where(sql`lower(${staffAccounts.email}) = ${email}`)
      .limit(1);
  } catch (error) {
    console.error("Portal sign-in lookup failed:", error);
    redirect("/sign-in?error=server");
  }

  const staffRole = staff && isPortalRole(staff.role) ? staff.role : null;
  const passwordValid = Boolean(staff?.isActive && staffRole && await bcrypt.compare(password, staff.passwordHash));
  if (!staff || !staffRole || !passwordValid) {
    try {
      await recordFailedLogin(key);
    } catch (error) {
      console.error("Portal failed-login recording failed:", error);
      redirect("/sign-in?error=server");
    }
    redirect("/sign-in?error=invalid");
  }

  const now = new Date();
  try {
    await db.batch([
      db.update(staffAccounts).set({ lastLogin: now }).where(eq(staffAccounts.id, staff.id)),
      db.delete(portalLoginAttempts).where(eq(portalLoginAttempts.throttleKey, key)),
    ]);
  } catch (error) {
    console.error("Portal sign-in session update failed:", error);
    redirect("/sign-in?error=server");
  }

  await setPortalSession({
    email: staff.email,
    id: staff.id,
    name: staff.fullName,
    role: staffRole,
    sessionVersion: staff.sessionVersion,
  });
  redirect("/dashboard");
}

export async function signOut() {
  await clearPortalSession();
  redirect("/sign-in");
}
