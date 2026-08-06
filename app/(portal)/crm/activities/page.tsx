import Link from "next/link";
import { Activity, CalendarClock, Link2 } from "lucide-react";

import { CrmEmptyState, CrmMessageBanner, CrmPageHeader, CrmStatusBadge } from "@/components/crm/crm-ui";
import { Card } from "@/components/ui/core";
import { getCrmActivities } from "@/lib/crm/data";
import { formatWibDateTime } from "@/lib/time/wib";

type ActivitiesPageProps = { searchParams: Promise<{ error?: string; notice?: string }> };

function entityHref(entityType: string | null, entityId: string | null) {
  if (!entityType || !entityId) return null;
  if (entityType === "company") return `/crm/companies/${entityId}`;
  if (entityType === "contact") return `/crm/contacts/${entityId}`;
  if (entityType === "lead") return `/crm/leads/${entityId}`;
  if (entityType === "opportunity") return `/crm/opportunities/${entityId}`;
  if (entityType === "quote_request") return `/quotes/${entityId}`;
  if (entityType === "shipment") return `/shipments/${encodeURIComponent(entityId)}`;
  return null;
}

export default async function CrmActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const query = await searchParams;
  const result = await getCrmActivities({ limit: 150 });
  return <div className="space-y-8">
    <CrmMessageBanner error={query.error} notice={query.notice} />
    <CrmPageHeader description="A scoped timeline of manually logged calls, WhatsApp, email, meetings, notes, and audited commercial status changes." icon={Activity} title="Activities" />
    <Card className="p-5 text-sm leading-6 text-slate-500">Log new activity from the related Company, Contact, Lead, or Opportunity so the relationship is validated and the entry appears in the correct timeline. Manual entries do not claim provider delivery receipts.</Card>
    {result.rows.length === 0 ? <CrmEmptyState description="No activities are visible in your authorized CRM scope yet." icon={Activity} title="No activity history" /> : <section className="space-y-3">{result.rows.map((activity) => { const href = entityHref(activity.entityType, activity.entityId); return <Card className="p-5" key={`${activity.id}-${activity.entityType}-${activity.entityId}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={activity.activityType} /><h2 className="font-semibold text-white">{activity.subject}</h2></div>{activity.details ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{activity.details}</p> : null}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{formatWibDateTime(activity.occurredAt)}</span><span>Owner: {activity.ownerName}</span>{href ? <Link className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200" href={href}><Link2 className="h-3.5 w-3.5" />{activity.entityType} #{activity.entityId}</Link> : null}</div></div></div></Card>; })}</section>}
  </div>;
}
