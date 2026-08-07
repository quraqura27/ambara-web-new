import Link from "next/link";
import { CalendarClock, ListTodo } from "lucide-react";
import { notFound } from "next/navigation";

import { updateCrmTaskAction, updateCrmTaskStatusForRecordAction } from "@/actions/crm-activities";
import { CrmTaskForm } from "@/components/crm/crm-forms";
import { CrmMessageBanner, CrmPageHeader, CrmStatusBadge } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { getCrmStaffOptions, getCrmTask, getCrmTeamOptions } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm } from "@/lib/portal-roles";
import { formatWibDateTime } from "@/lib/time/wib";

type TaskDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

function linkedRecordPath(entityType: string | null, entityId: string | null) {
  if (!entityType || !entityId) return "/crm/tasks";
  if (["company", "contact", "lead", "opportunity"].includes(entityType)) {
    return `/crm/${entityType === "company" ? "companies" : entityType === "opportunity" ? "opportunities" : `${entityType}s`}/${entityId}`;
  }
  if (entityType === "quote_request") return `/quotes/${entityId}`;
  if (entityType === "shipment") return `/shipments/${encodeURIComponent(entityId)}`;
  return "/crm/tasks";
}

export default async function CrmTaskDetailPage({ params, searchParams }: TaskDetailPageProps) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const query = await searchParams;
  const [task, staff, teams, user] = await Promise.all([
    getCrmTask(id),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    getPortalUser(),
  ]);
  if (!task || !task.entityType || !task.entityId) notFound();
  const canEdit = canManageCrm(user);
  const recordPath = linkedRecordPath(task.entityType, task.entityId);
  const updateAction = updateCrmTaskAction.bind(null, id);
  const completeAction = updateCrmTaskStatusForRecordAction.bind(null, id, `/crm/tasks/${id}`);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader
        actionHref="/crm/tasks"
        actionLabel="Back to tasks"
        description={`Owned by ${task.ownerName}${task.ownerTeamName ? ` · ${task.ownerTeamName}` : ""} · Updated ${formatWibDateTime(task.updatedAt)}`}
        icon={ListTodo}
        title={task.subject}
      />
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={task.status} /><CrmStatusBadge status={task.priority} /></div>
        {task.details ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-400">{task.details}</p> : null}
        <div className="mt-5 flex flex-wrap gap-4 border-t border-white/5 pt-5 text-xs text-slate-500">
          <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />{formatWibDateTime(task.dueAt, "No due date")}</span>
          <Link className="text-blue-300 hover:text-blue-200" href={recordPath}>Open linked {task.entityType}</Link>
        </div>
        {canEdit && ["open", "in_progress"].includes(task.status) ? <form action={completeAction} className="mt-5"><input name="status" type="hidden" value="completed" /><Button type="submit" variant="secondary">Mark complete</Button></form> : null}
      </Card>
      {canEdit ? (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 font-semibold text-white">Edit task</h2>
          <CrmTaskForm
            action={updateAction}
            entityId={task.entityId}
            entityType={task.entityType}
            staff={staff}
            submitLabel="Save task"
            task={task}
            teams={teams}
          />
        </Card>
      ) : null}
    </div>
  );
}
