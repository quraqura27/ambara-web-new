import { db } from "@/lib/db";
import { customers as customerTable } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Users, Search, Filter, Building2, User, Mail, Phone, Globe, Edit3, Database } from "lucide-react";
import CRMContent from "./CRMContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CRMPage() {
  try {
    const data = await db.select().from(customerTable);

    return (
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
               <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Operational Registry</h2>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
              CRM Command Center
            </h1>
            <p className="text-slate-500 mt-2 font-medium max-w-xl">
              Managing {data.length} synchronized identities discovered via manifest ingestion and manual registration.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-blue-600/5 border border-blue-500/10 rounded-xl flex items-center gap-3">
                <Database size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">NeonDB: Realtime</span>
             </div>
          </div>
        </header>

        <CRMContent initialCustomers={data} />
      </div>
    );
  } catch (error) {
    console.error("CRM RSC Crash:", error);
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-32 glass-panel rounded-[3rem]">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
           <Database size={40} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Sync Protocol Interrupted</h2>
        <p className="text-slate-500 mt-2 font-medium">The customer repository is currently unreachable via the Data API.</p>
        <button className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
          Retry Connection
        </button>
      </div>
    );
  }
}
