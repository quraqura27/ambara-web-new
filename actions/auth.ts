"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { staffAccounts } from "@/lib/db/schema";
import { clearPortalSession, setPortalSession } from "@/lib/portal-auth";

function normalize(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  const email = normalize(formData.get("email")).toLowerCase();
  const password = normalize(formData.get("password"));

  if (!email || !password) {
    redirect("/sign-in?error=missing");
  }

  if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    redirect("/sign-in?error=config");
  }

  let staff;
  try {
    [staff] = await db
      .select()
      .from(staffAccounts)
      .where(eq(staffAccounts.email, email))
      .limit(1);
  } catch (error) {
    console.error("Portal sign-in lookup failed:", error);
    redirect("/sign-in?error=server");
  }

  if (!staff?.isActive || !(await bcrypt.compare(password, staff.passwordHash))) {
    redirect("/sign-in?error=invalid");
  }

  await db
    .update(staffAccounts)
    .set({ lastLogin: new Date() })
    .where(eq(staffAccounts.id, staff.id));

  await setPortalSession({
    email: staff.email,
    id: staff.id,
    name: staff.fullName,
    role: staff.role,
  });

  redirect("/dashboard");
}

export async function signOut() {
  await clearPortalSession();
  redirect("/sign-in");
}
