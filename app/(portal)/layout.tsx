import { PortalShell } from "@/components/portal/portal-shell";
import { requirePortalUser } from "@/lib/portal-auth";
import { getPortalCapabilities } from "@/lib/portal-roles";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser();

  return (
    <PortalShell
      capabilities={getPortalCapabilities(user)}
      user={{ name: user.name, role: user.role }}
    >
      {children}
    </PortalShell>
  );
}
