import React from "react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
// Assume some Clerk auth checks will go here after Middleware phase

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  let pendingUsers: any[] = [];
  try {
    pendingUsers = await db.select().from(profiles).where(eq(profiles.status, 'PENDING'));
  } catch (e) {
    console.error("DASHBOARD DB ERROR (AdminUsers):", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Pending Approvals</h2>
        <p className="text-neutral-400">Review and assign roles to new users.</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        {pendingUsers.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No pending users require approval right now.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-800/50 text-neutral-400 text-sm border-b border-neutral-700">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Current Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                  <td className="p-4 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="p-4 text-neutral-300">{user.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-medium">
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 flex space-x-2">
                    <form action={async () => {
                      "use server";
                      const { approveUser } = await import("@/app/actions/admin");
                      await approveUser(user.clerkId, "OPERATIONS");
                    }}>
                      <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg shadow-md transition-all">
                        Approve (OPS)
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      const { denyUser } = await import("@/app/actions/admin");
                      await denyUser(user.clerkId);
                    }}>
                      <button type="submit" className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-red-400 border border-neutral-700 text-sm rounded-lg transition-all">
                        Deny
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
