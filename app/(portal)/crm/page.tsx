import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CalendarCheck2,
  CircleDollarSign,
  ListTodo,
  Plus,
  Target,
} from "lucide-react";

import { getCrmDashboard } from "@/lib/crm/data";
import { CrmMetricCard, CrmPageHeader } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";

const workspaces = [
  {
    description: "Capture inquiries, qualify freight requirements, and keep the next follow-up visible.",
    href: "/crm/leads",
    icon: Target,
    label: "Lead workspace",
  },
  {
    description: "Review open commercial pursuits by stage, owner, route, value, and close date.",
    href: "/crm/pipeline",
    icon: CircleDollarSign,
    label: "Sales pipeline",
  },
  {
    description: "Maintain neutral company records for prospects, customers, agents, and suppliers.",
    href: "/crm/companies",
    icon: Building2,
    label: "Company directory",
  },
  {
    description: "Prioritize overdue commitments and record calls, email, WhatsApp, and meetings.",
    href: "/crm/tasks",
    icon: ListTodo,
    label: "Follow-up queue",
  },
] as const;

export default async function CrmDashboardPage() {
  const dashboard = await getCrmDashboard();

  return (
    <div className="space-y-8">
      <CrmPageHeader
        actionHref="/crm/leads/new"
        actionLabel="New lead"
        description="One commercial workspace for inquiries, relationships, next actions, and the freight sales pipeline. Operational shipment execution and Finance remain in their existing modules."
        icon={Plus}
        title="Commercial overview"
      />

      <section aria-label="CRM summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CrmMetricCard
          detail="Active inquiries in your authorized scope"
          icon={Target}
          label="Active leads"
          value={dashboard.metrics.activeLeads}
        />
        <CrmMetricCard
          detail="Open pursuits across pipeline stages"
          icon={CircleDollarSign}
          label="Open opportunities"
          tone="emerald"
          value={dashboard.metrics.openOpportunities}
        />
        <CrmMetricCard
          detail="Open tasks whose due time has passed"
          icon={AlertTriangle}
          label="Overdue tasks"
          tone={dashboard.metrics.overdueTasks > 0 ? "rose" : "blue"}
          value={dashboard.metrics.overdueTasks}
        />
        <CrmMetricCard
          detail="Tasks due today in WIB"
          icon={CalendarCheck2}
          label="Due today"
          tone="amber"
          value={dashboard.metrics.dueToday}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="CRM workspaces">
        {workspaces.map(({ description, href, icon: Icon, label }) => (
          <Link href={href} key={href}>
            <Card className="h-full p-5 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]">
              <div className="flex items-start gap-4">
                <span className="rounded-lg border border-blue-500/15 bg-blue-500/10 p-3 text-blue-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-white">{label}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="flex flex-col gap-4 border-amber-500/10 bg-amber-500/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">Quotation boundary</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            This release records an external quotation reference and status. Supplier costing, approval,
            versioned customer PDFs, and acceptance-to-shipment conversion remain protected behind the
            planned native quotation release.
          </p>
        </div>
        <Link className="shrink-0" href="/quotes">
          <Button variant="secondary">Website inquiries</Button>
        </Link>
      </Card>
    </div>
  );
}
