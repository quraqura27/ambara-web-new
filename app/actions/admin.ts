"use server";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function approveUser(clerkId: string, role: string) {
  if (!clerkId || !role) throw new Error("Missing parameters");

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  if (!CLERK_SECRET_KEY) throw new Error("Missing CLERK_SECRET_KEY");

  // Update Clerk Provider Metadata
  await fetch(`https://api.clerk.com/v1/users/${clerkId}/metadata`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      public_metadata: { role }
    })
  });

  // Update Database Record
  await db.update(profiles)
    .set({ status: 'ACTIVE', role })
    .where(eq(profiles.clerkId, clerkId));

  revalidatePath('/dashboard/admin/users');
}

export async function denyUser(clerkId: string) {
  if (!clerkId) throw new Error("Missing clerkId");

  await db.update(profiles)
    .set({ status: 'SUSPENDED' })
    .where(eq(profiles.clerkId, clerkId));

  revalidatePath('/dashboard/admin/users');
}
