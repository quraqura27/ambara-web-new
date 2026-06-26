"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { signOut } from "@/actions/auth";
import { cn } from "@/components/ui/core";
import { normalizePortalRole, portalRoleLabels } from "@/lib/portal-roles";

type PortalShellProps = {
  canExportShipments: boolean;
  canManageAccounts: boolean;
  canUseMawbs: boolean;
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
  };
};

type NavItem = {
  href: string;
  icon: typeof Home;
  label: string;
  mobileSafe?: boolean;
  secondary?: boolean;
};

function NavLink({
  item,
  onNavigate,
  pathname,
}: {
  item: NavItem;
  onNavigate: () => void;
  pathname: string;
}) {
  const active =
    item.href === "/dashboard"
      ? pathname === item.href
      : item.href === "/shipments"
        ? pathname === "/shipments" ||
          (pathname.startsWith("/shipments/") &&
            !["/shipments/new", "/shipments/bulk-import", "/shipments/export"].some(
              (href) => pathname.startsWith(href),
            ))
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
        item.secondary && "ml-5 py-2 text-xs",
        active
          ? "bg-blue-500/15 text-white ring-1 ring-inset ring-blue-500/20"
          : "text-slate-400 hover:bg-white/5 hover:text-white",
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <Icon className={cn("h-5 w-5", item.secondary && "h-4 w-4", active && "text-blue-400")} />
      <span>{item.label}</span>
      {!item.mobileSafe && item.secondary ? (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-amber-400 sm:hidden">
          Desktop recommended
        </span>
      ) : null}
    </Link>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    accounts: "Staff Accounts",
    "bulk-import": "Bulk Import",
    created: "Created",
    customers: "Customers",
    dashboard: "Home",
    "delivery-batches": "Delivery",
    edit: "Edit",
    export: "Export",
    mawbs: "MAWB",
    new: "New",
    search: "Search",
    shipments: "Shipments",
  };

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs text-slate-500 md:flex">
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labels[segment] || decodeURIComponent(segment);
        return (
          <span className="flex items-center gap-1" key={href}>
            {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
            {isLast ? (
              <span className="max-w-52 truncate text-slate-300">{label}</span>
            ) : (
              <Link className="hover:text-white" href={href}>{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PortalShell({
  canExportShipments,
  canManageAccounts,
  canUseMawbs,
  children,
  user,
}: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = normalizePortalRole(user.role);
  const groups: Array<{ items: NavItem[]; label: string }> = [
    {
      label: "Home",
      items: [{ href: "/dashboard", icon: Home, label: "Operations Home", mobileSafe: true }],
    },
    {
      label: "Primary Tasks",
      items: [
        { href: "/shipments/new", icon: UserPlus, label: "Input One Shipment", mobileSafe: true },
        { href: "/shipments/bulk-import", icon: Upload, label: "Bulk Input" },
        { href: "/search", icon: Search, label: "Find and Track", mobileSafe: true },
      ],
    },
    {
      label: "Records",
      items: [
        { href: "/shipments", icon: Package, label: "All Shipments", mobileSafe: true },
        ...(canUseMawbs
          ? [{ href: "/mawbs", icon: FileText, label: "MAWB Documents", mobileSafe: true }]
          : []),
        ...(canExportShipments
          ? [{ href: "/shipments/export", icon: FileSpreadsheet, label: "Export", secondary: true }]
          : []),
        { href: "/customers", icon: Users, label: "Customers", mobileSafe: true },
        { href: "/delivery-batches", icon: ClipboardList, label: "Delivery Batches", mobileSafe: true },
      ],
    },
    ...(canManageAccounts
      ? [{
          label: "Administration",
          items: [{ href: "/accounts", icon: Shield, label: "Staff Accounts", mobileSafe: true }],
        }]
      : []),
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <div className="px-2">
          <Image src="/logo.png" alt="PT Ambara Artha Globaltrans" className="h-auto w-44 invert" width={4000} height={622} priority />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Operations Portal</p>
        </div>
        <button aria-label="Close navigation" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)} type="button">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink item={item} key={item.href} onNavigate={() => setMobileOpen(false)} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs text-slate-500">Logged in as</p>
        <p className="mt-2 truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
          {portalRoleLabels[role]}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh min-w-0 overflow-hidden bg-[#0a0a0f] text-slate-100">
      <aside className="hidden w-72 shrink-0 border-r border-white/5 bg-[#0d0d14] p-6 lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation overlay" className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} type="button" />
          <aside className="relative h-full w-[min(88vw,320px)] border-r border-white/10 bg-[#0d0d14] p-5 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 border-b border-white/5 bg-[#0d0d14]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden" onClick={() => setMobileOpen(true)} type="button">
              <Menu className="h-5 w-5" />
            </button>
            <Breadcrumbs pathname={pathname} />
            <form action="/search" className="relative ml-auto min-w-0 flex-1 sm:max-w-md" method="get" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                aria-label="Search portal"
                className="w-full rounded-full border border-slate-700 bg-slate-900/60 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                name="q"
                placeholder="Tracking, customer, AWB, reference, batch..."
              />
            </form>
            <form action={signOut}>
              <button aria-label="Sign out" className="flex items-center gap-2 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" type="submit">
                <LogOut className="h-5 w-5" />
                <span className="hidden text-sm font-medium sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </header>

        <section className="custom-scrollbar min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto min-w-0 max-w-7xl">{children}</div>
        </section>
      </main>
    </div>
  );
}
