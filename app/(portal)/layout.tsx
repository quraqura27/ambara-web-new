import Link from "next/link";
import Image from "next/image";
import { LucideIcon, LayoutDashboard, LogOut, Package, Search, Users } from "lucide-react";

import { searchShipmentByTracking } from "@/actions/shipments";

export const dynamic = "force-dynamic";

type NavItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
};

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  return (
    <Link
      className="group flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
      href={href}
    >
      <Icon className="h-5 w-5 group-hover:text-white" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0a0a0f] text-slate-100">
      <aside className="z-20 flex w-72 flex-col gap-8 border-r border-white/5 bg-[#0d0d14] p-6">
        <div className="flex items-center gap-3 px-2">
          <div>
            <Image src="/logo.png" alt="PT Ambara Artha Globaltrans" className="h-auto w-44 invert" width={4000} height={622} priority />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Portal v5.0
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Main Menu
          </p>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/customers" icon={Users} label="Customer Directory" />
          <NavItem href="/shipments" icon={Package} label="Shipment Tracking" />
        </nav>

        <div className="mt-auto">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-4">
            <p className="mb-3 text-xs text-slate-500">Logged in as</p>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                AA
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium">Internal Staff</p>
                <p className="text-[10px] font-bold uppercase text-blue-400">Operations</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-20 items-center justify-between border-b border-white/5 bg-[#0d0d14]/50 px-8 backdrop-blur-xl">
          <div className="text-sm text-slate-400">
            Customer directory and shipment tracking workspace
          </div>

          <div className="flex items-center gap-6">
            <form action={searchShipmentByTracking} className="group relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
              <input
                className="w-64 rounded-full border border-slate-700 bg-slate-900/50 py-2 pl-10 pr-4 text-sm transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                name="trackingNumber"
                placeholder="Jump to tracking number..."
              />
            </form>

            <div className="h-6 w-px bg-white/10" />

            <Link className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white" href="/admin.html">
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign Out</span>
            </Link>
          </div>
        </header>

        <section className="custom-scrollbar flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </section>
      </main>
    </div>
  );
}
