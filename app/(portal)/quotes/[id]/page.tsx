import Link from "next/link";
import { ArrowLeft, CalendarClock, Mail, MapPin, Package, Phone } from "lucide-react";
import { notFound } from "next/navigation";

import { getQuoteDetail, updateQuoteFromForm } from "@/actions/quotes";
import { quoteStatusValues } from "@/lib/quotes/core";
import { Button, Input } from "@/components/ui/core";
import { StatusBadge } from "@/components/portal/status-badge";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageQuotes } from "@/lib/portal-roles";
import { formatWibDate, formatWibDateTime, toWibDateTimeLocalValue } from "@/lib/time/wib";

type QuoteDetailProps = { params: Promise<{ id: string }>; searchParams?: Promise<{ notice?: string }> };
const selectClass = "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm";

export default async function QuoteDetailPage({ params, searchParams }: QuoteDetailProps) {
  const id = Number.parseInt((await params).id, 10);
  const [detail, user, query] = await Promise.all([
    getQuoteDetail(id),
    getPortalUser(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  if (!detail) notFound();
  const action = updateQuoteFromForm.bind(null, id);
  const { quote } = detail;
  return (
    <div className="space-y-6">
      {query?.notice ? <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{query.notice}</div> : null}
      <header className="flex items-start gap-3"><Link href="/quotes"><Button aria-label="Back to quotes" className="h-9 w-9 p-0" title="Back to quotes" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link><div><div className="flex items-center gap-2"><p className="font-mono text-xs text-blue-300">{quote.referenceNumber}</p><StatusBadge status={quote.status} /></div><h1 className="mt-2 text-2xl font-semibold">{quote.companyName || quote.contactName}</h1><p className="mt-1 text-sm text-slate-500">Received {formatWibDateTime(quote.createdAt)}</p></div></header>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <section className="space-y-5 rounded-lg border border-white/5 p-5"><h2 className="text-sm font-semibold">Request detail</h2><div className="grid gap-4 sm:grid-cols-2"><p className="flex items-center gap-2 text-sm text-slate-300"><MapPin className="h-4 w-4 text-slate-600" />{quote.origin} to {quote.destination}</p><p className="flex items-center gap-2 text-sm text-slate-300"><CalendarClock className="h-4 w-4 text-slate-600" />Ready {formatWibDate(quote.readyDate)}</p><p className="flex items-center gap-2 text-sm text-slate-300"><Package className="h-4 w-4 text-slate-600" />{quote.weightKg || "-"} kg / {quote.volumeCbm || "-"} CBM / {quote.numPackages || "-"} packages</p><p className="text-sm text-slate-300">{quote.freightType || "air"} / {quote.incoterms || "Incoterm not set"}</p><p className="flex items-center gap-2 text-sm text-slate-300"><Mail className="h-4 w-4 text-slate-600" />{quote.email}</p><p className="flex items-center gap-2 text-sm text-slate-300"><Phone className="h-4 w-4 text-slate-600" />{quote.phone || "-"}</p></div><div><p className="text-xs font-semibold uppercase text-slate-600">Cargo</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{quote.cargoDescription || "-"}</p></div><div><p className="text-xs font-semibold uppercase text-slate-600">Customer notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{quote.notes || quote.specialRequirements || "-"}</p></div></section>
        <section className="rounded-lg border border-white/5 p-5"><h2 className="text-sm font-semibold">Commercial workflow</h2>{canManageQuotes(user) ? <form action={action} className="mt-4 space-y-4"><label className="space-y-2"><span className="text-xs text-slate-500">Status</span><select className={selectClass} defaultValue={quote.status} name="status">{quoteStatusValues.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="space-y-2"><span className="text-xs text-slate-500">Owner</span><select className={selectClass} defaultValue={quote.assignedTo ?? ""} name="assignedTo"><option value="">Unassigned</option>{detail.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.fullName} / {staff.role}</option>)}</select></label><label className="space-y-2"><span className="text-xs text-slate-500">Next action</span><Input defaultValue={quote.nextAction ?? ""} maxLength={240} name="nextAction" /></label><label className="space-y-2"><span className="text-xs text-slate-500">Due (WIB)</span><Input defaultValue={toWibDateTimeLocalValue(quote.dueAt)} name="dueAt" type="datetime-local" /></label><label className="space-y-2"><span className="text-xs text-slate-500">Internal notes</span><textarea className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm" defaultValue={quote.internalNotes ?? ""} maxLength={5000} name="internalNotes" /></label><label className="space-y-2"><span className="text-xs text-slate-500">Close reason (required for lost/closed)</span><Input maxLength={500} name="closeReason" /></label><Button type="submit">Save workflow</Button></form> : <p className="mt-4 text-sm text-slate-500">Read-only quote access.</p>}</section>
      </div>
    </div>
  );
}
