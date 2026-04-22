"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Edit3, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  MapPin,
  X
} from "lucide-react";
import { updateCustomer } from "@/app/actions/customer-actions";
import { motion, AnimatePresence } from "framer-motion";

export default function CRMContent({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await updateCustomer(editingCustomer.id, editingCustomer);
      setCustomers(customers.map(c => c.id === editingCustomer.id ? editingCustomer : c));
      setEditingCustomer(null);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search directory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1">
             {["ALL", "b2b", "SHIPPER"].map((type) => (
               <button
                 key={type}
                 onClick={() => setTypeFilter(type)}
                 className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                   typeFilter === type ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
                 }`}
               >
                 {type === "b2b" ? "Agent" : type === "ALL" ? "Global" : "Shipper"}
               </button>
             ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Entities:</span>
           <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-black text-blue-400">{filtered.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((customer) => (
          <div 
            key={customer.id} 
            className="premium-card group relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-0 right-0 p-6">
               <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                 customer.type === "b2b" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
               }`}>
                 {customer.type}
               </div>
            </div>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                {customer.type === "b2b" ? <Building2 size={24} /> : <User size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-white text-lg tracking-tight truncate">
                  {customer.fullName || customer.companyName || "Unnamed Entity"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-50" />
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest truncate">
                     {customer.companyName || "Private Account"}
                   </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <ContactItem icon={<Mail size={14} />} text={customer.email} />
              <ContactItem icon={<Phone size={14} />} text={customer.phone} />
              <ContactItem icon={<Globe size={14} />} text={customer.countryCode || "ID"} highlight />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center gap-3">
              <button 
                onClick={() => setEditingCustomer(customer)}
                className="flex-1 bg-white text-black hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-xl shadow-white/5 active:scale-95"
              >
                Configure Profile
              </button>
              <button className="p-3 bg-slate-900 text-slate-500 hover:text-white rounded-xl border border-slate-800 transition-all">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal - Restyled */}
      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
              onClick={() => setEditingCustomer(null)} 
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleUpdate}
              className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
              
              <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                     <Edit3 className="text-blue-500" size={24} /> Profile Configuration
                   </h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 ml-9">Global Entity Registry</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingCustomer(null)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormInput label="Full Identity Name" value={editingCustomer.fullName} onChange={(v) => setEditingCustomer({...editingCustomer, fullName: v})} />
                  <FormInput label="Region Code" value={editingCustomer.countryCode} maxLength={2} onChange={(v) => setEditingCustomer({...editingCustomer, countryCode: v.toUpperCase()})} mono />
                </div>

                <FormInput label="Corporate Entity" value={editingCustomer.companyName} onChange={(v) => setEditingCustomer({...editingCustomer, companyName: v})} />

                <div className="grid grid-cols-2 gap-6">
                  <FormInput label="Electronic Mail" value={editingCustomer.email} type="email" onChange={(v) => setEditingCustomer({...editingCustomer, email: v})} />
                  <FormInput label="Telecommunication" value={editingCustomer.phone} onChange={(v) => setEditingCustomer({...editingCustomer, phone: v})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Registered Logistics Hub / Address</label>
                  <textarea 
                    value={editingCustomer.address || ""}
                    onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-slate-200 focus:border-blue-500/50 outline-none transition-all min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  Commit Changes
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactItem({ icon, text, highlight = false }: any) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400 group/item">
      <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 group-hover/item:text-blue-400 transition-colors`}>
        {icon}
      </div>
      <span className={`truncate font-medium ${highlight ? "text-blue-400 font-black" : ""}`}>{text || "N/A"}</span>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text", maxLength, mono = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type}
        maxLength={maxLength}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all ${mono ? "font-mono" : "font-bold"}`}
      />
    </div>
  );
}
