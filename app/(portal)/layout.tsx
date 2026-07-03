import { PortalShell } from "@/components/portal/portal-shell";
import { canUseMawbWorkflow } from "@/lib/mawbs/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { canManageInvoices, canManageStaffAccounts } from "@/lib/portal-roles";
import { canExportShipments } from "@/lib/shipment-export/core";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser();

  return (
    <PortalShell
      canExportShipments={canExportShipments(user)}
      canManageAccounts={canManageStaffAccounts(user)}
      canManageInvoices={canManageInvoices(user)}
      canUseMawbs={canUseMawbWorkflow(user)}
      user={{ name: user.name, role: user.role }}
    >
      {children}
    </PortalShell>
  );
}
