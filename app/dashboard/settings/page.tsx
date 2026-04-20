"use client";

import { 
  Shield, 
  User, 
  Bell, 
  Globe, 
  Database, 
  Key,
  Save
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h2 className="text-3xl font-bold text-white">System Settings</h2>
        <p className="text-slate-400 mt-1">Configure portal behavior and security protocols.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="space-y-1">
          <SettingsNavLink icon={<User size={18} />} label="Profile" active />
          <SettingsNavLink icon={<Shield size={18} />} label="Security" />
          <SettingsNavLink icon={<Bell size={18} />} label="Notifications" />
          <SettingsNavLink icon={<Globe size={18} />} label="Regional" />
          <SettingsNavLink icon={<Database size={18} />} label="Connections" />
        </aside>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-8 pb-12">
          <section className="bg-[#0f0f16] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
              <User className="text-blue-400" size={24} />
              <h3 className="text-lg font-bold text-white">Identity Parameters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portal Display Name</label>
                <input 
                  type="text" 
                  defaultValue="Ambara Master Terminal"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Email</label>
                <input 
                  type="email" 
                  defaultValue="quraisyabdurrahman@ambaraartha.com"
                  readOnly
                  className="w-full bg-slate-950/20 border border-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <section className="bg-[#0f0f16] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
              <Key className="text-blue-400" size={24} />
              <h3 className="text-lg font-bold text-white">Security Hardening</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Sovereign Sentinel Mode</h4>
                  <p className="text-xs text-slate-500">Enforce Edge-level database role checks on every request.</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-[0_0_10px_rgba(37,99,235,0.4)] cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Session Persistence</h4>
                  <p className="text-xs text-slate-500">Keep admin sessions active for 30 days across browser restarts.</p>
                </div>
                <div className="w-12 h-6 bg-slate-800 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex justify-end pt-4 border-t border-slate-800/50">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(37,99,235,0.4)]">
              <Save size={18} /> Update Configuration
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function SettingsNavLink({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active 
        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
    }`}>
      {icon}
      {label}
    </button>
  );
}
