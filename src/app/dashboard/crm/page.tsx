"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Globe, 
  Mail, 
  Phone, 
  Home, 
  ChevronRight,
  ShieldCheck,
  Building2
} from "lucide-react";
import { getAllCustomers, updateCustomer } from "@/app/actions/customer-actions";

export default function CRMPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load CRM data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await updateCustomer(editingCustomer.id, editingCustomer);
      setEditingCustomer(null);
      loadCustomers();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = (c.fullName || "").toLowerCase().includes(search.toLowerCase()) || 
                          (c.companyName || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 text-glow flex items-center gap-3">
             <Users className="text-blue-500" /> CRM Command Center
          </h2>
          <p className="text-sm text-slate-500">Managing {customers.length} unified profiles found across manifest ingestion.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0f0f16] border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-all text-slate-300 w-64"
            />
          </div>
          <select 
            className="bg-[#0f0f16] border border-slate-800 rounded-xl py-2 px-4 text-[10px] font-bold text-slate-400 focus:outline-none focus:border-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">ALL TYPES</option>
            <option value="b2b">BILLING AGENT</option>
            <option value="SHIPPER">SHIPPER</option>
            <option value="CONSIGNEE">CONSIGNEE</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((customer) => (
            <div 
              key={customer.id} 
              className="bg-[#0f0f16] border border-slate-800/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                 <span className={`text-[9px] font-black px-2 py-1 rounded-full ${
                   customer.type === "b2b" ? "bg-blue-600/10 text-blue-500" : "bg-emerald-600/10 text-emerald-500"
                 }`}>
                   {customer.type}
                 </span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                  {customer.type === "b2b" ? <Building2 size={24} /> : <User size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 truncate group-hover:text-white transition-colors">
                    {customer.fullName || customer.companyName || "Unnamed Entity"}
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">
                    {customer.companyName || "Personal Account"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Mail size={14} className="text-slate-600" />
                  <span className="truncate">{customer.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Phone size={14} className="text-slate-600" />
                  <span>{customer.phone || "No phone provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Globe size={14} className="text-slate-600" />
                  <span className="font-bold text-blue-400">{customer.countryCode || "ID"}</span>
                </div>
              </div>

              <button 
                onClick={() => setEditingCustomer(customer)}
                className="w-full bg-slate-800/50 hover:bg-blue-600 text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
              >
                <Edit3 size={12} /> MANAGE PROFILE
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingCustomer(null)} />
          <form 
            onSubmit={handleUpdate}
            className="relative bg-[#0f0f16] border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Edit3 className="text-blue-500" /> Edit CRM Profile
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
                  <input 
                    type="text"
                    value={editingCustomer.fullName || ""}
                    onChange={(e) => setEditingCustomer({...editingCustomer, fullName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Country (ISO)</label>
                  <input 
                    type="text"
                    maxLength={2}
                    value={editingCustomer.countryCode || ""}
                    onChange={(e) => setEditingCustomer({...editingCustomer, countryCode: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all uppercase font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Company Name</label>
                <input 
                  type="text"
                  value={editingCustomer.companyName || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, companyName: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email</label>
                  <input 
                    type="email"
                    value={editingCustomer.email || ""}
                    onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone</label>
                  <input 
                    type="text"
                    value={editingCustomer.phone || ""}
                    onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Address</label>
                <textarea 
                  value={editingCustomer.address || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all min-h-[80px]"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-sm font-bold py-3 rounded-xl transition-all"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                SAVE CHANGES
              </button>
            </div>
            
            <p className="mt-4 text-center text-[10px] text-slate-600 uppercase tracking-widest">Profile Deletion Restricted for Data Integrity</p>
          </form>
        </div>
      )}
    </div>
  );
}
