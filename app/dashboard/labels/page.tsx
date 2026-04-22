"use client";

import { useState, useEffect } from "react";
import { 
  Printer, 
  Search, 
  ChevronRight, 
  Box, 
  MapPin, 
  User,
  ShieldCheck,
  Zap,
  Loader2,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Settings,
  ArrowRight
} from "lucide-react";
import { getShipmentsForLabels } from "@/app/actions/shipment-actions";
import { getShipmentLabels } from "@/app/actions/print-actions";

export default function LabelPage() {
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [printing, setPrinting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getShipmentsForLabels();
        setLabels(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (err) {
        console.error("Failed to load labels:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = async () => {
    if (!selected) return;
    try {
      setPrinting(true);
      const base64Data = await getShipmentLabels([selected.id]);
      
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Printing failed:", err);
    } finally {
      setPrinting(false);
    }
  };

  const filteredLabels = labels.filter(l => 
    (l.internalTrackingNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.shipper || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.consignee || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
             <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Operational Terminal</h2>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Thermal Label Port</h1>
          <p className="text-slate-500 mt-2 font-medium max-w-lg">Direct-to-printer manifest generation for warehouse dispatch.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printer: ZEBRA-GK420T</span>
          </div>
          <button className="p-3 bg-slate-900 text-slate-500 hover:text-white rounded-xl border border-slate-800 transition-all">
             <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Queue Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search Queue..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-900/50 border border-slate-800/50 rounded-2xl animate-pulse" />
              ))
            ) : filteredLabels.length > 0 ? (
              filteredLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => setSelected(label)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group relative overflow-hidden ${
                    selected?.id === label.id 
                      ? "bg-blue-600/10 border-blue-500/50 shadow-2xl shadow-blue-600/10" 
                      : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  {selected?.id === label.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black tracking-widest uppercase ${selected?.id === label.id ? "text-blue-400" : "text-slate-600"}`}>
                        {selected?.id === label.id ? "Selected Manifest" : "Pending Queue"}
                      </span>
                      {selected?.id === label.id && <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />}
                    </div>
                    <span className="text-sm font-mono font-black text-slate-200 tracking-tight">{label.internalTrackingNo}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                       <User size={12} className="opacity-50" />
                       <span className="truncate max-w-[180px]">{label.shipper || "Anonymous"}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={`${selected?.id === label.id ? "text-blue-500" : "text-slate-700"} group-hover:translate-x-1 transition-transform`} />
                </button>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto opacity-20">
                    <Search size={24} />
                 </div>
                 <p className="text-xs font-black text-slate-700 uppercase tracking-widest">No matching manifests</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Zap size={16} className="text-blue-500" /></div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Printer calibration</h4>
             </div>
             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
               Optimized for 100mm x 150mm thermal stock. Ensure DPI is set to 203 or higher for barcode scannability.
             </p>
          </div>
        </div>

        {/* Right: High-Fidelity Preview */}
        <div className="lg:col-span-8">
          <div className="glass-panel rounded-[2.5rem] p-10 flex flex-col items-center bg-gradient-to-br from-slate-900/50 to-slate-950/50 h-full">
            {/* VIRTUAL LABEL PLATFORM */}
            <div className="relative group/label">
              <div className="absolute -inset-4 bg-blue-600/5 blur-3xl rounded-full opacity-0 group-hover/label:opacity-100 transition-opacity" />
              
              <div id="print-area" className="relative z-10 bg-white w-[360px] h-[540px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col text-black font-sans-label overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b-4 border-black flex justify-between items-start">
                   <div className="flex flex-col">
                      <h1 className="text-2xl font-black tracking-tighter italic leading-none">AMBARA ARTHA</h1>
                      <span className="text-[9px] font-black tracking-[0.3em] uppercase mt-1">Cargo Operations</span>
                   </div>
                   <QrCode size={40} className="text-black" />
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col">
                  {/* Tracking */}
                  <div className="mb-8">
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-50">Internal ID</span>
                    <div className="bg-black text-white p-4 font-mono font-black text-xl tracking-[0.2em] text-center">
                      {selected?.internalTrackingNo || "NO-DATA"}
                    </div>
                  </div>

                  {/* Routes */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="border-r-2 border-slate-200">
                      <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Origin</span>
                      <span className="text-4xl font-black tracking-tighter">{selected?.origin || "???"}</span>
                    </div>
                    <div className="pl-2">
                      <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Destination</span>
                      <span className="text-4xl font-black tracking-tighter text-blue-600">{selected?.destination || "???"}</span>
                    </div>
                  </div>

                  {/* Entities */}
                  <div className="space-y-6 flex-1">
                    <div className="p-3 border-2 border-black">
                      <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Consignee (To)</span>
                      <p className="text-sm font-black leading-tight uppercase line-clamp-2">{selected?.consignee || "RECIPIENT PENDING"}</p>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Shipper (From)</span>
                      <p className="text-xs font-bold leading-tight uppercase line-clamp-1">{selected?.shipper || "CLIENT SENDER"}</p>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="mt-auto pt-6 border-t-4 border-black flex justify-between items-end">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Weight Class</span>
                      <span className="text-3xl font-black tracking-tighter">{selected?.weight || "0.0"} <span className="text-sm">KG</span></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Service</span>
                      <span className="text-lg font-black tracking-tighter uppercase">{selected?.serviceType || "STANDARD"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Controls */}
            <div className="mt-12 w-full max-w-sm space-y-4">
              <button 
                onClick={handlePrint}
                disabled={printing || !selected}
                className="w-full bg-white text-black hover:bg-slate-200 disabled:opacity-50 font-black text-sm uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/5 active:scale-95"
              >
                {printing ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} 
                {printing ? "Generating Stream" : "Initialize Print Pipeline"}
              </button>
              
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Ready</span>
                </div>
                <div className="w-px h-3 bg-slate-800" />
                <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                  Label Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .font-sans-label {
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
}
