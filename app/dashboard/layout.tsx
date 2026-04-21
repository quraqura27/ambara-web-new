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

        <nav className="flex-1 px-4 space-y-1" style={{ flex: 1, paddingLeft: '16px', paddingRight: '16px', marginTop: '4px' }}>
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
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  textDecoration: 'none',
                  color: active ? '#60a5fa' : '#94a3b8',
                  backgroundColor: active ? 'rgba(37,99,235,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(59,130,246,0.2)' : 'none',
                  marginBottom: '4px'
                }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50" style={{ padding: '16px', borderTop: '1px solid rgba(30,41,59,0.5)' }}>
          <div className="flex items-center gap-3 px-3 py-2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="text-xs font-medium text-slate-200" style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>Admin Session</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '-0.05em' }}>Terminal Active</span>
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
            justifyContent: 'space-between', 
            paddingLeft: '24px', 
            paddingRight: '24px', 
            backgroundColor: 'rgba(15,15,22,0.8)', 
            backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid rgba(30,41,59,0.5)', 
            zIndex: 10 
          }}
        >
          <button 
            className="lg:hidden text-slate-400"
            onClick={() => setMobileMenuOpen(true)}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center flex-1 max-w-md ml-4 lg:ml-0" style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '448px' }}>
            <div className="relative w-full" style={{ position: 'relative', width: '100%' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Search Tracking, AWB, or Invoice..." 
                className="w-full rounded-full py-2 pl-10 pr-4 text-xs transition-all"
                style={{ 
                  width: '100%',
                  backgroundColor: 'rgba(15,23,42,0.8)', 
                  border: '1px solid #1e293b', 
                  borderRadius: '9999px',
                  padding: '8px 16px 8px 40px',
                  color: '#cbd5e1', 
                  fontSize: '12px',
                  outline: 'none' 
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
            <div className="hidden md:flex flex-col items-end mr-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px' }}>
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="w-2 h-2 rounded-full bg-green-500" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }}></span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider" style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.05em' }}>SYSTEM ONLINE</span>
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
