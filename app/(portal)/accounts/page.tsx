import { KeyRound, Save, Shield, UserPlus, Users } from "lucide-react";
import { redirect } from "next/navigation";

import {
  createStaffAccountFromForm,
  getStaffAccounts,
  resetStaffPasswordFromForm,
  setStaffAccountActive,
  updateStaffAccountFromForm,
} from "@/actions/staff-accounts";
import { Button, Card, Input, cn } from "@/components/ui/core";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  canManageStaffAccounts,
  isAssignableStaffRole,
  portalRoleLabels,
  staffAssignableRoles,
  type StaffAssignableRole,
} from "@/lib/portal-roles";

type AccountsPageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
};

type StaffAccount = Awaited<ReturnType<typeof getStaffAccounts>>[number];

const selectClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString();
}

function statusClassName(isActive: boolean | null) {
  return isActive === false
    ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
}

function RoleSelect({
  defaultValue,
  id,
  name = "role",
}: {
  defaultValue: StaffAssignableRole;
  id: string;
  name?: string;
}) {
  return (
    <select className={selectClassName} defaultValue={defaultValue} id={id} name={name} required>
      {staffAssignableRoles.map((role) => (
        <option key={role} value={role}>
          {portalRoleLabels[role]}
        </option>
      ))}
    </select>
  );
}

function MessageBanner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {error || notice}
    </div>
  );
}

function AccountStatusBadge({ isActive }: { isActive: boolean | null }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight",
        statusClassName(isActive),
      )}
    >
      {isActive === false ? "Inactive" : "Active"}
    </span>
  );
}

function StaffAccountRow({
  account,
  currentUserId,
}: {
  account: StaffAccount;
  currentUserId: number;
}) {
  const isCurrentUser = account.id === currentUserId;
  const editableRole = isAssignableStaffRole(account.role) ? account.role : "operations";
  const updateAction = updateStaffAccountFromForm.bind(null, account.id);
  const toggleActiveAction = setStaffAccountActive.bind(null, account.id, account.isActive === false);
  const resetPasswordAction = resetStaffPasswordFromForm.bind(null, account.id);

  return (
    <tr className="align-top transition-colors hover:bg-white/[0.02]">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-600/20 bg-blue-600/10 font-bold text-blue-400">
            {account.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{account.fullName}</p>
            <p className="truncate text-xs text-slate-500">{account.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-blue-400">
          {account.roleLabel}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="space-y-2 text-xs text-slate-500">
          <AccountStatusBadge isActive={account.isActive} />
          <p>Last login: {formatDate(account.lastLogin)}</p>
          <p>Created: {formatDate(account.createdAt)}</p>
        </div>
      </td>
      <td className="min-w-[360px] px-6 py-5">
        <form action={updateAction} className="grid gap-3 md:grid-cols-[1fr_150px_auto]">
          <label className="sr-only" htmlFor={`fullName-${account.id}`}>
            Full name
          </label>
          <Input
            defaultValue={account.fullName}
            id={`fullName-${account.id}`}
            name="fullName"
            required
          />
          <label className="sr-only" htmlFor={`role-${account.id}`}>
            Role
          </label>
          <RoleSelect defaultValue={editableRole} id={`role-${account.id}`} />
          <Button className="gap-2" type="submit" variant="secondary">
            <Save className="h-4 w-4" /> Save
          </Button>
        </form>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <form action={resetPasswordAction} className="flex min-w-0 gap-3">
            <label className="sr-only" htmlFor={`password-${account.id}`}>
              New password
            </label>
            <Input
              autoComplete="new-password"
              className="min-w-0"
              id={`password-${account.id}`}
              minLength={8}
              name="password"
              placeholder="New password"
              required
              type="password"
            />
            <Button aria-label={`Reset password for ${account.fullName}`} className="gap-2" type="submit" variant="ghost">
              <KeyRound className="h-4 w-4" /> Reset
            </Button>
          </form>

          <form action={toggleActiveAction}>
            <Button
              disabled={isCurrentUser && account.isActive !== false}
              title={isCurrentUser ? "Self-deactivation is blocked" : undefined}
              type="submit"
              variant={account.isActive === false ? "secondary" : "danger"}
            >
              {account.isActive === false ? "Activate" : "Deactivate"}
            </Button>
          </form>

          {isCurrentUser ? (
            <span className="self-center text-xs font-bold uppercase tracking-widest text-slate-600">
              Current user
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const user = await requirePortalUser();

  if (!canManageStaffAccounts(user)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const accounts = await getStaffAccounts();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Accounts</h2>
          <p className="mt-1 text-slate-500">
            Superadmin access for portal account status, roles, and password resets.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-300">
          <Shield className="h-4 w-4" />
          Superadmin
        </div>
      </div>

      <MessageBanner error={resolvedSearchParams?.error} notice={resolvedSearchParams?.notice} />

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-slate-900 text-blue-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Create Staff Account</h3>
            <p className="text-xs text-slate-500">New accounts are active after creation.</p>
          </div>
        </div>

        <form action={createStaffAccountFromForm} className="grid gap-4 lg:grid-cols-[1fr_1fr_170px_1fr_auto]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500" htmlFor="new-fullName">
              Full Name
            </label>
            <Input id="new-fullName" name="fullName" required />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500" htmlFor="new-email">
              Email
            </label>
            <Input autoComplete="email" id="new-email" name="email" required type="email" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500" htmlFor="new-role">
              Role
            </label>
            <RoleSelect defaultValue="operations" id="new-role" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500" htmlFor="new-password">
              Password
            </label>
            <Input
              autoComplete="new-password"
              id="new-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full gap-2" type="submit">
              <UserPlus className="h-4 w-4" /> Create
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-visible p-0">
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-500" />
            <h3 className="text-base font-semibold">Account List</h3>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Results: {accounts.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {accounts.map((account) => (
                <StaffAccountRow account={account} currentUserId={user.id} key={account.id} />
              ))}

              {accounts.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={4}>
                    <div className="flex flex-col items-center">
                      <Users className="mb-4 h-12 w-12 text-slate-800" />
                      <p className="text-lg font-medium">No staff accounts found</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
