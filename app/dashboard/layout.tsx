"use client";

import { UserButton } from "@clerk/nextjs";
import { 
  BarChart3, 
  Package, 
  FileText, 
  Settings, 
  PlusCircle, 
  Tag, 
  Search,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Shipments", href: "/dashboard/shipments", icon: Package },
  { name: "Ingest AWB", href: "/dashboard/ingest", icon: PlusCircle },
  { name: "Labels", href: "/dashboard/labels", icon: Tag },
  { name: "Finance", href: "/dashboard/finance", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 ambara-portal-bg">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900/40 backdrop-blur-md border-r border-slate-800/50 ambara-sidebar-shell">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              AMBARA
            </h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase pl-11">Command Center</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ambara-nav-item ${
                  active 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon size={18} className={`${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <UserButton afterSignOutUrl="/" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#020617] rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-200 truncate">Admin Active</span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Terminal v5.0</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        {/* Header */}
        <header className="h-20 border-b border-slate-800/50 bg-[#020617]/60 backdrop-blur-xl flex items-center justify-between px-8 z-20 sticky top-0 ambara-header-shell">
          <button 
            className="lg:hidden text-slate-400 p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Quick search (AWB, Tracking, Invoices...)" 
                className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-slate-900/60 transition-all text-slate-200 placeholder:text-slate-600"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-500 font-mono">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-500 font-mono">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase">Operations Live</span>
              </div>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <button className="text-slate-400 hover:text-white transition-colors relative">
               <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]" />
               <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Content Region */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute left-0 top-0 bottom-0 w-80 bg-slate-950 border-r border-slate-800 p-8 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="text-white" size={20} />
                </div>
                <h1 className="text-lg font-black tracking-tighter">AMBARA</h1>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-2 hover:bg-slate-800 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            {/* Mobile Nav Items */}
            <div className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm transition-all ${
                      active ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
