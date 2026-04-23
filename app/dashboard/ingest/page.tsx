"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Database,
  ShieldCheck,
  Zap,
  Box,
  ChevronRight,
  Info
} from "lucide-react";
import { scrapeAWB } from "@/lib/parser/awb-scraper";
import { uploadAndProcessAWB, saveScrapedAWB } from "@/app/actions/awb-actions";
import { getB2BCustomers, quickAddCustomer } from "@/app/actions/customer-actions";

export default function IngestPage() {
  const { userId } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "parsing" | "review" | "saving" | "success" | "error">("idle");
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const list = await getB2BCustomers();
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      handleProcess(acceptedFiles[0]);
    }
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false
  });

  const handleProcess = async (targetFile: File) => {
    try {
      setStatus("uploading");
      setError(null);

      const formData = new FormData();
      formData.append("file", targetFile);
      if (userId) formData.append("uploaderId", userId);
      const uploadResult = await uploadAndProcessAWB(formData);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed. Server rejected the file.");
      }

      setStatus("parsing");
      const scraped = await scrapeAWB(uploadResult.url);
      
      setScrapedData({ ...scraped, url: uploadResult.url });
      setStatus("review");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process AWB");
      setStatus("error");
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setScrapedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      setError("Please select or create a Billing Customer first.");
      return;
    }

    try {
      setStatus("saving");
      const saveResult = await saveScrapedAWB(scrapedData, selectedCustomerId, userId || undefined);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save record");
      }
      
      setStatus("success");
    } catch (err: any) {
      setError(err.message || "Failed to save record");
      setStatus("error");
    }
  };

  const handleQuickAdd = async () => {
    if (!customerSearch.trim()) return;
    try {
      setIsAddingCustomer(true);
      const newCust = await quickAddCustomer(customerSearch.trim());
      setCustomers(prev => [...prev, newCust]);
      setSelectedCustomerId(newCust.id);
      setCustomerSearch("");
    } catch (err) {
      console.error("Quick add failed", err);
    } finally {
      setIsAddingCustomer(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
           <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Data Ingestion Portal</h2>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">Deterministic AWB Terminal</h1>
        <p className="text-slate-500 mt-2 font-medium">Extract cargo manifests with zero-error coordinate mapping.</p>
      </header>

      <div className={`grid grid-cols-1 gap-10 transition-all duration-700 ${status === "review" ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        {/* Input Region */}
        <div className="space-y-8">
          {status === "review" ? (
            <div className="h-[700px] glass-panel rounded-[2rem] overflow-hidden relative group">
              <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Source Document</span>
              </div>
              <iframe 
                src={scrapedData.url} 
                className="w-full h-full border-none grayscale-[0.2] opacity-90 group-hover:opacity-100 transition-opacity"
                title="AWB Preview"
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto w-full">
              <div 
                {...getRootProps()} 
                className={`relative group border-2 border-dashed rounded-[2.5rem] p-16 transition-all cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden ${
                  isDragActive ? "border-blue-500 bg-blue-500/5" : "border-slate-800 hover:border-blue-500/30 bg-slate-900/20"
                }`}
              >
                <input {...getInputProps()} />
                
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-20 h-20 rounded-3xl bg-slate-800/80 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-2xl border border-slate-700/50 relative z-10">
                  <Upload className="text-blue-400 group-hover:text-blue-300" size={32} />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-3 relative z-10 tracking-tight">Deploy Manifest PDF</h3>
                <p className="text-slate-500 max-w-sm relative z-10 font-medium">Standard Master Air Waybills (MAWB) from Garuda, AirAsia, Citilink, and major global carriers.</p>
                
                <div className="mt-8 px-6 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest relative z-10">
                  Drag & Drop or Click to Select
                </div>

                <AnimatePresence>
                  {(status === "uploading" || status === "parsing") && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#020617]/95 flex flex-col items-center justify-center z-20 backdrop-blur-md"
                    >
                      <div className="relative">
                         <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin" />
                         <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" size={24} />
                      </div>
                      <span className="mt-6 text-[10px] font-black tracking-[0.4em] uppercase text-blue-400 animate-pulse">
                        {status === "parsing" ? "Synchronizing Coordinates" : "Uploading Manifest"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                <StatsBadge icon={<ShieldCheck size={18} />} title="Deterministic" desc="100% Logic" color="text-emerald-500" />
                <StatsBadge icon={<Database size={18} />} title="Persistence" desc="Neon Sync" color="text-blue-500" />
                <StatsBadge icon={<Box size={18} />} title="Warehouse" desc="Auto-Entry" color="text-purple-500" />
              </div>
            </div>
          )}
        </div>

        {/* Form Region */}
        <AnimatePresence mode="wait">
          {status === "review" || status === "saving" || status === "success" ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel rounded-[2rem] overflow-hidden flex flex-col h-full max-h-[700px] relative"
            >
              <div className="bg-slate-900/40 px-8 py-6 border-b border-slate-800/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-600/10 rounded-lg"><FileText size={16} className="text-blue-500" /></div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Extraction Result</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black uppercase">Verified</span>
                </div>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                {/* Billing Account - High Attention */}
                <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-blue-400 tracking-widest uppercase">Target Billing Account</label>
                    <Info size={14} className="text-blue-400 opacity-50" />
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search established accounts..."
                      value={selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.fullName || customers.find(c => c.id === selectedCustomerId)?.companyName) : customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (selectedCustomerId) setSelectedCustomerId(null);
                      }}
                      className="w-full bg-slate-950/50 border border-blue-500/30 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-all font-bold"
                    />
                    {customerSearch && !selectedCustomerId && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden z-30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto">
                        {customers.filter(c => 
                          (c.fullName || "").toLowerCase().includes(customerSearch.toLowerCase()) || 
                          (c.companyName || "").toLowerCase().includes(customerSearch.toLowerCase())
                        ).map(c => (
                          <button 
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearch("");
                            }}
                            className="w-full px-6 py-3.5 text-left text-sm text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold">{c.fullName || c.companyName}</span>
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                        <button 
                          onClick={handleQuickAdd}
                          className="w-full px-6 py-4 text-left text-xs text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-t border-slate-800 flex items-center gap-3 font-black uppercase tracking-widest"
                        >
                          {isAddingCustomer ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
                          Register "{customerSearch}"
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <EditableField label="AWB Number" value={scrapedData.awbNumber} onChange={(v) => handleFieldChange("awbNumber", v)} />
                  <EditableField label="Carrier / Airline" value={scrapedData.airline} onChange={(v) => handleFieldChange("airline", v)} />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <EditableField label="Flight Ident" value={scrapedData.flightNumber} onChange={(v) => handleFieldChange("flightNumber", v)} />
                    <EditableField label="Schedule" value={scrapedData.flightDate} onChange={(v) => handleFieldChange("flightDate", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <EditableField label="Origin" value={scrapedData.origin} onChange={(v) => handleFieldChange("origin", v)} />
                    <EditableField label="Destination" value={scrapedData.destination} onChange={(v) => handleFieldChange("destination", v)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <EditableField label="Quantity (PCS)" value={scrapedData.pieces} onChange={(v) => handleFieldChange("pieces", v)} />
                    <EditableField label="Weight (CHRG)" value={scrapedData.weight} highlight={true} onChange={(v) => handleFieldChange("weight", v)} />
                  </div>

                  <EditableField label="Shipper Entity" value={scrapedData.shipper} multiline={true} onChange={(v) => handleFieldChange("shipper", v)} />
                  <EditableField label="Consignee Entity" value={scrapedData.consignee} multiline={true} onChange={(v) => handleFieldChange("consignee", v)} />
                </div>
              </div>

              <div className="p-8 bg-slate-900/40 border-t border-slate-800/50 shrink-0">
                {status === "review" ? (
                  <button 
                    onClick={handleSave}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                  >
                    Commit Transaction <ArrowRight size={18} />
                  </button>
                ) : status === "saving" ? (
                  <button disabled className="w-full bg-slate-800 text-slate-500 font-black text-sm uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin" size={18} /> Synchronizing...
                  </button>
                ) : status === "success" ? (
                  <div className="space-y-4">
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-sm uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3">
                      <CheckCircle2 size={18} /> Database Secured
                    </div>
                    <button 
                      onClick={() => { setStatus("idle"); setScrapedData(null); }}
                      className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Initialize New Session
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : status === "error" ? (
            <div className="glass-panel rounded-[2rem] p-12 text-center max-w-xl mx-auto">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-rose-500" size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Terminal Error</h3>
              <p className="text-slate-400 font-medium mb-8 leading-relaxed">{error}</p>
              <button 
                onClick={() => setStatus("idle")}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Reset Terminal
              </button>
            </div>
          ) : (
            <div className="h-64 border border-slate-800/40 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-slate-700 group">
              <Zap size={40} className="mb-4 opacity-20 group-hover:opacity-40 transition-opacity" />
              <p className="text-xs font-bold uppercase tracking-widest">Neural Link Idle</p>
              <p className="text-[10px] uppercase tracking-widest mt-1 opacity-40">System ready for AWB injection</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EditableField({ label, value, onChange, highlight = false, multiline = false }: any) {
  return (
    <div className="space-y-2">
      <span className="text-[9px] font-black text-slate-600 tracking-[0.2em] uppercase ml-1">{label}</span>
      {multiline ? (
        <textarea 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 font-mono resize-none focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800"
        />
      ) : (
        <input 
          type="text"
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500/50 transition-all ${highlight ? "border-blue-500/30 text-blue-400" : ""}`}
        />
      )}
    </div>
  );
}

function StatsBadge({ icon, title, desc, color }: any) {
  return (
    <div className="glass-panel p-5 rounded-3xl flex items-center gap-4 group hover:border-slate-700/50 transition-all">
      <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{title}</span>
        <span className="text-xs font-bold text-slate-300">{desc}</span>
      </div>
    </div>
  );
}

function PlusCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
    </svg>
  );
}
