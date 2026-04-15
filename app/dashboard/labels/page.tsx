"use client";

import { useState, useEffect } from "react";
import Barcode from "react-barcode";
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
  QrCode
} from "lucide-react";
import { getShipmentsForLabels } from "@/app/actions/shipment-actions";
import { getShipmentLabels } from "@/app/actions/print-actions";

export default function LabelPage() {
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [printing, setPrinting] = useState(false);

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
      
      // Convert Base64 to binary
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

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 text-glow">Thermal Label Terminal</h2>
        <p className="text-sm text-slate-500 underline decoration-blue-500/30 underline-offset-4 decoration-2">Direct-to-Printer Label Generation Engine (Spec v3)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Queue Selection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Filter by Tracking or Customer..." 
              className="w-full bg-[#0f0f16] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-slate-300"
            />
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => setSelected(label)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                  selected?.id === label.id 
                    ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.15)]" 
                    : "bg-[#0f0f16] border-slate-800 hover:border-slate-700 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-bold tracking-widest ${selected?.id === label.id ? "text-blue-400" : "text-slate-500"}`}>READY FOR PRINT</span>
                  <span className="text-sm font-mono font-bold text-slate-200">{label.internalTrackingNo}</span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">{label.shipper || "Unknown Shipper"}</span>
                </div>
                <ChevronRight size={18} className={selected?.id === label.id ? "text-blue-500" : "text-slate-700"} />
              </button>
            ))}
          </div>

          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
            <Zap size={20} className="text-blue-500 mt-1" />
            <p className="text-[11px] text-blue-200/60 leading-relaxed font-medium">
              Labels are formatted for standard 100mm x 150mm (4x6) thermal paper. 
              Ensure your browser's print scale is set to "Actual Size" for 100% scanning accuracy.
            </p>
          </div>
        </div>

        {/* Right: Premium Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* THE PRINTABLE REGION */}
          <div id="print-area" className="print-safe bg-white w-[380px] h-[550px] shadow-2xl rounded-sm p-6 flex flex-col text-black font-sans-label">
            {/* Header / Logo */}
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter italic">AMBARA ARTHA</h1>
                <span className="text-[10px] font-bold tracking-[0.2em] leading-none uppercase">International Air Transport</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-bold block">OPERATIONS ID</span>
                <span className="text-xs font-black">ADMIN-001</span>
              </div>
            </div>

            {/* Tracking Barcode */}
            <div className="flex flex-col items-center justify-center mb-6 py-2 border-b-2 border-dashed border-slate-300">
              <span className="text-[10px] font-bold mb-1">INTERNAL TRACKING BARCODE</span>
              <div className="bg-black p-4 w-full flex justify-center">
                 <div className="bg-white h-12 w-full flex items-center justify-center font-mono font-bold text-xl tracking-[0.2em]">
                    {selected?.internalTrackingNo}
                 </div>
              </div>
            </div>

            {/* Routing */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border-r-2 border-black pr-2">
                <span className="text-[10px] font-black uppercase block mb-1">ORIGIN</span>
                <span className="text-3xl font-black tracking-tighter">{selected?.origin}</span>
                <p className="text-[9px] font-bold mt-1 text-slate-600">Primary Hub</p>
              </div>
              <div className="pl-2">
                <span className="text-[10px] font-black uppercase block mb-1">DESTINATION</span>
                <span className="text-3xl font-black tracking-tighter">{selected?.destination}</span>
                <p className="text-[9px] font-bold mt-1 text-slate-600">Arrival Terminal</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex-1 space-y-4 pt-4 border-t-4 border-black">
              <div>
                <span className="text-[9px] font-black uppercase block leading-none mb-1">SHIPPER (FROM)</span>
                <p className="text-xs font-bold leading-tight uppercase">{selected?.shipper || "VALUED AMBARA CLIENT"}</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase block leading-none mb-1">CONSIGNEE (TO)</span>
                <p className="text-sm font-black leading-tight uppercase">{selected?.consignee || "PENDING RESOLUTION"}</p>
              </div>
            </div>

            {/* Stats Footer */}
            <div className="mt-auto border-t-2 border-black pt-4 flex justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold">GROSS WT / CHG WT</span>
                    <span className="text-xl font-black tracking-tighter">{selected?.weight} KG</span>
                </div>
                <div className="flex items-center gap-2">
                   <QrCode size={40} className="text-black" />
                   <div className="bg-black text-white px-3 py-2 text-right">
                       <span className="text-[8px] font-bold block leading-none">SERVICE</span>
                       <span className="text-sm font-black tracking-tighter uppercase">{selected?.serviceType || "AIRFREIGHT"}</span>
                   </div>
                </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
                onClick={handlePrint}
                disabled={printing || !selected}
                className="bg-white text-black hover:bg-slate-200 disabled:opacity-50 font-black px-12 py-4 rounded-full transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95"
            >
              {printing ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />} 
              {printing ? "GENERATING PDF..." : "SEND TO THERMAL PORT"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100mm;
            height: 150mm;
            border: none;
            box-shadow: none;
            margin: 0;
            padding: 10mm;
          }
        }
        .text-glow {
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        .font-sans-label {
            font-family: 'Inter', system-ui, sans-serif;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
