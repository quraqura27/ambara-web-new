import Link from "next/link";
import { AlertTriangle, CalendarClock, Link2, ListTodo } from "lucide-react";

import { updateCrmTaskStatusAction } from "@/actions/crm-activities";
import { CrmEmptyState, CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { crmTaskStatusValues } from "@/lib/crm/constants";
import { getCrmTasks } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm } from "@/lib/portal-roles";
import { formatWibDateTime } from "@/lib/time/wib";

type TasksPageProps = { searchParams: Promise<{ error?: string; notice?: string; status?: string }> };
function label(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
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

export default async function CrmTasksPage({ searchParams }: TasksPageProps) {
  const query = await searchParams;
  const [result, user] = await Promise.all([
    getCrmTasks({ limit: 150, status: query.status || undefined }),
    getPortalUser(),
  ]);
  const canEdit = canManageCrm(user);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader description="Prioritize dated follow-ups and prevent freight inquiries or opportunities from being forgotten." icon={ListTodo} title="Tasks and follow-ups" />
      <Card className="p-5"><form className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 space-y-2"><span className="text-xs font-semibold text-slate-500">Status</span><select className={crmFieldClassName} defaultValue={query.status ?? ""} name="status"><option value="">All statuses</option>{crmTaskStatusValues.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label><Button type="submit" variant="secondary">Apply filter</Button></form></Card>
      <Card className="p-5 text-sm leading-6 text-slate-500">Create tasks from a related Company, Contact, Lead, or Opportunity. Completing or reopening a Lead or Opportunity task synchronizes that record&apos;s next-action summary.</Card>
      {result.rows.length === 0 ? <CrmEmptyState description="No tasks match this authorized scope and status filter." icon={ListTodo} title="No tasks found" /> : (
        <section className="space-y-3">
          {result.rows.map((task) => {
            const href = entityHref(task.entityType, task.entityId);
            const overdue = Boolean(task.dueAt && task.dueAt < new Date() && ["open", "in_progress"].includes(task.status));
            const statusAction = updateCrmTaskStatusAction.bind(null, task.id);
            return (
              <Card className="p-5" key={task.id}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={task.status} /><CrmStatusBadge status={task.priority} />{overdue ? <span className="flex items-center gap-1 text-xs font-semibold text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />Overdue</span> : null}</div>
                    <Link className="mt-3 block font-semibold text-white hover:text-blue-300" href={`/crm/tasks/${task.id}`}>{task.subject}</Link>
                    {task.details ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{task.details}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className={`flex items-center gap-1.5 ${overdue ? "text-rose-300" : ""}`}><CalendarClock className="h-3.5 w-3.5" />{formatWibDateTime(task.dueAt, "No due date")}</span><span>Owner: {task.ownerName}</span>{href ? <Link className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200" href={href}><Link2 className="h-3.5 w-3.5" />{task.entityType} #{task.entityId}</Link> : null}</div>
                  </div>
                  {canEdit ? <form action={statusAction} className="flex items-end gap-2"><label className="flex-1 space-y-2"><span className="text-xs text-slate-500">Update status</span><select className={crmFieldClassName} defaultValue={task.status} name="status">{crmTaskStatusValues.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label><Button type="submit" variant="secondary">Save</Button></form> : null}
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
