import { db } from "@/lib/db";
import { customers as customerTable } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Users, Search, Filter, Building2, User, Mail, Phone, Globe, Edit3 } from "lucide-react";
import CRMContent from "./CRMContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CRMPage() {
  try {
    // Fetch directly from DB in RSC to ensure connectivity
    const data = await db.select().from(customerTable);

    return (
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 text-glow flex items-center gap-3">
               <Users className="text-blue-500" /> CRM Command Center
            </h2>
            <p className="text-sm text-slate-500">Managing {data.length} unified profiles found across manifest ingestion.</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Database Sync: Active</span>
          </div>
        </header>

        {/* Pass data to a client component for searching/filtering/editing */}
        <CRMContent initialCustomers={data} />
      </div>
    );
  } catch (error) {
    console.error("CRM RSC Crash:", error);
    return (
      <div className="max-w-7xl mx-auto text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
        <Users size={48} className="mx-auto mb-4 text-slate-700" />
        <h2 className="text-xl font-bold text-white">CRM Sync Interrupted</h2>
        <p className="text-slate-500">The customer database is currently unreachable. Retrying connection...</p>
      </div>
    );
  }
}
