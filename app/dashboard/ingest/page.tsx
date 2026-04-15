"use client";

import { useState, useCallback } from "react";
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
  ShieldCheck
} from "lucide-react";
import { scrapeAWB } from "@/lib/parser/awb-scraper";
import { uploadAndProcessAWB, saveScrapedAWB } from "@/app/actions/awb-actions";
import { getB2BCustomers, quickAddCustomer } from "@/app/actions/customer-actions";
import { useEffect } from "react";

export default function IngestPage() {
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
  }, []);

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
      const uploadResult = await uploadAndProcessAWB(formData);

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
      setStatus("review");
      return;
    }

    try {
      setStatus("saving");
      await saveScrapedAWB(scrapedData, selectedCustomerId);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className={`mb-10 transition-all ${status === "review" ? "text-left" : "text-center"}`}>
        <h2 className="text-3xl font-bold text-white mb-2">Ambara Ingest Terminal</h2>
        <p className="text-slate-400">Deterministic AWB extraction & industrial data sync.</p>
      </header>

      <div className={`grid grid-cols-1 gap-8 transition-all ${status === "review" ? "lg:grid-cols-2" : "lg:grid-cols-12"}`}>
        {/* Left: Upload OR PDF Preview */}
        <div className={`${status === "review" ? "h-[750px]" : "lg:col-span-6"} space-y-6`}>
          {status === "review" ? (
            <div className="h-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
              <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Source Document
              </div>
              <iframe 
                src={scrapedData.url} 
                className="w-full h-full border-none"
                title="AWB Preview"
              />
            </div>
          ) : (
            <>
              <div 
                {...getRootProps()} 
                className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                  isDragActive ? "border-blue-500 bg-blue-500/5" : "border-slate-800 hover:border-slate-700 bg-slate-900/10"
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg border border-slate-700/50">
                  <Upload className="text-blue-400" size={28} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Upload AWB PDF</h3>
                <p className="text-sm text-slate-500 max-w-xs">Supports Garuda, AirAsia, Citilink, Qatar & more.</p>
                
                {(status === "uploading" || status === "parsing") && (
                  <div className="absolute inset-0 bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-blue-400">
                      {status === "parsing" ? "Analysing Coordinates..." : "Buffering to R2..."}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatsBadge icon={<ShieldCheck size={20} />} title="Deterministic" desc="High Precision" color="text-green-500" />
                <StatsBadge icon={<Database size={20} />} title="Neon DB" desc="Instant Sync" color="text-blue-500" />
              </div>
            </>
          )}
        </div>

        {/* Right: Results Preview / Form */}
        <div className={`${status === "review" ? "" : "lg:col-span-6"}`}>
          <AnimatePresence mode="wait">
            {status === "review" || status === "saving" || status === "success" ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[750px]"
              >
                <div className="bg-slate-800/20 px-6 py-4 border-b border-slate-800/50 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText size={14} /> EXTRACTED MANIFEST
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">v15.2 GOLD</span>
                </div>
                
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                  {/* Billing Customer Selector (Spec v3 Revised) */}
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                    <label className="text-[9px] font-black text-blue-400 tracking-wider uppercase">Billing Customer (Shipment Owner)</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Select or Add Customer..."
                        value={selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.fullName || customers.find(c => c.id === selectedCustomerId)?.companyName) : customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomerId) setSelectedCustomerId(null);
                        }}
                        className="w-full bg-slate-950/50 border border-blue-500/30 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all font-medium"
                      />
                      {customerSearch && !selectedCustomerId && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden z-30 shadow-2xl max-h-48 overflow-y-auto">
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
                              className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between"
                            >
                              <span>{c.fullName || c.companyName}</span>
                              <span className="text-[8px] opacity-50 uppercase tracking-widest">{c.countryCode}</span>
                            </button>
                          ))}
                          <button 
                            onClick={handleQuickAdd}
                            className="w-full px-4 py-2.5 text-left text-xs text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-t border-slate-800 flex items-center gap-2 font-bold"
                          >
                            {isAddingCustomer ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
                            Quick Add "{customerSearch}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <EditableField 
                    label="AWB NUMBER" 
                    value={scrapedData.awbNumber} 
                    onChange={(v) => handleFieldChange("awbNumber", v)}
                  />
                  <EditableField 
                    label="AIRLINE / CARRIER" 
                    value={scrapedData.airline} 
                    onChange={(v) => handleFieldChange("airline", v)}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="FLIGHT NO" value={scrapedData.flightNumber} onChange={(v) => handleFieldChange("flightNumber", v)} />
                    <EditableField label="DATE" value={scrapedData.flightDate} onChange={(v) => handleFieldChange("flightDate", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="ORIGIN" value={scrapedData.origin} onChange={(v) => handleFieldChange("origin", v)} />
                    <EditableField label="DESTINATION" value={scrapedData.destination} onChange={(v) => handleFieldChange("destination", v)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="PIECES" value={scrapedData.pieces} onChange={(v) => handleFieldChange("pieces", v)} />
                    <EditableField label="CHRG WEIGHT" value={scrapedData.weight} highlight={true} onChange={(v) => handleFieldChange("weight", v)} />
                  </div>

                  <EditableField 
                    label="SHIPPER ADDRESS" 
                    value={scrapedData.shipper} 
                    multiline={true}
                    onChange={(v) => handleFieldChange("shipper", v)}
                  />
                  
                  <EditableField 
                    label="CONSIGNEE ADDRESS" 
                    value={scrapedData.consignee} 
                    multiline={true}
                    onChange={(v) => handleFieldChange("consignee", v)}
                  />

                  <div className="pt-4 sticky bottom-0 bg-slate-900/50 backdrop-blur-md -mx-6 px-6 pb-2">
                    {status === "review" ? (
                      <button 
                        onClick={handleSave}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
                      >
                        COMMIT TO SYSTEM <ArrowRight size={18} />
                      </button>
                    ) : status === "saving" ? (
                      <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} /> SYNCING...
                      </button>
                    ) : status === "success" ? (
                      <div className="space-y-4">
                        <div className="w-full bg-green-500/10 border border-green-500/20 text-green-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} /> SHIPMENT SECURED
                        </div>
                        <button 
                          onClick={() => { setStatus("idle"); setScrapedData(null); }}
                          className="w-full text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                          Process Another AWB
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : status === "error" ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-12 text-center">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-white mb-2">Extraction Error</h3>
                <p className="text-sm text-slate-400 mb-6">{error}</p>
                <button 
                  onClick={() => setStatus("idle")}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Return to Terminal
                </button>
              </div>
            ) : (
              <div className="h-full min-h-[400px] border border-slate-800/40 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 text-center text-slate-600">
                <FileText size={48} className="mb-4 opacity-10" />
                <p className="text-sm font-medium">Ready for AWB processing.</p>
                <p className="text-[10px] uppercase tracking-widest mt-2 opacity-50">Industrial Grade Scraper Activity Idle</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EditableField({ 
  label, 
  value, 
  onChange, 
  highlight = false, 
  multiline = false 
}: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  highlight?: boolean,
  multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase">{label}</span>
      {multiline ? (
        <textarea 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="bg-slate-950/50 border border-slate-800/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all scrollbar-hide"
        />
      ) : (
        <input 
          type="text"
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          className={`bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all ${highlight ? "border-blue-500/30 text-blue-400" : ""}`}
        />
      )}
    </div>
  );
}

function StatsBadge({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  return (
    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{title}</span>
        <span className="text-xs font-bold text-slate-300">{desc}</span>
      </div>
    </div>
  );
}
