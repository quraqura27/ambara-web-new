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
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
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
    <div 
      className="ambara-portal-bg"
      style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0f',
        color: '#f8fafc'
      }}
    >
      {/* Sidebar - Desktop */}
      <aside 
        className="hidden lg:flex ambara-sidebar-shell"
        style={{ 
          width: '256px', 
          flexShrink: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: '#0f0f16', 
          borderRight: '1px solid rgba(30,41,59,0.5)',
          position: 'relative'
        }}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold ambara-heading-main" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            AMBARA PORTAL
          </h1>
          <p className="text-[10px] text-slate-500 tracking-widest mt-1">COMMAND CENTER v3</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ambara-nav-item ${
                  active 
                    ? "bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200">Admin Session</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Terminal Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className="ambara-main-shell"
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          overflow: 'hidden' 
        }}
      >
        {/* Header */}
        <header 
          className="ambara-header-shell"
          style={{ 
            height: '64px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'between', 
            paddingLeft: '24px', 
            paddingRight: '24px', 
            backgroundColor: 'rgba(15,15,22,0.5)', 
            backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid rgba(30,41,59,0.5)', 
            zIndex: 10 
          }}
        >
          <button 
            className="lg:hidden text-slate-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center flex-1 max-w-md ml-4 lg:ml-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search Tracking, AWB, or Invoice..." 
                className="w-full rounded-full py-2 pl-10 pr-4 text-xs transition-all"
                style={{ 
                  backgroundColor: 'rgba(15,23,42,0.5)', 
                  border: '1px solid #1e293b', 
                  color: '#cbd5e1', 
                  outline: 'none' 
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.5)' }}></span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">SYSTEM ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Region */}
        <div 
          className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px' 
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-[#0f0f16] border-r border-slate-800 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-lg font-bold">AMBARA</h1>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                      active ? "bg-blue-600 text-white" : "text-slate-400"
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
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
