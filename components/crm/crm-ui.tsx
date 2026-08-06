import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button, Card, cn } from "@/components/ui/core";

export const crmFieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25";

export const crmTextareaClassName = `${crmFieldClassName} min-h-28 resize-y`;

export function CrmFormSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function CrmField({
  children,
  className,
  help,
  label,
  required,
}: {
  children: React.ReactNode;
  className?: string;
  help?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-xs font-semibold text-slate-400">
        {label}
        {required ? <span className="ml-1 text-rose-400">*</span> : null}
      </span>
      {children}
      {help ? <span className="block text-xs leading-5 text-slate-600">{help}</span> : null}
    </label>
  );
}

export function CrmPageHeader({
  actionHref,
  actionLabel,
  description,
  eyebrow = "Commercial CRM",
  icon: Icon,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link className="shrink-0" href={actionHref}>
          <Button className="w-full gap-2 sm:w-auto" type="button">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {actionLabel}
          </Button>
        </Link>
      ) : Icon ? (
        <Icon className="hidden h-8 w-8 shrink-0 text-blue-300 sm:block" />
      ) : null}
    </header>
  );
}

const statusTone: Record<string, string> = {
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  contacted: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  qualified: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  quotation_sent: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  negotiation: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  follow_up: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  won: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  lost: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  disqualified: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  overdue: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  dormant: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  open: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  new: "border-blue-500/20 bg-blue-500/10 text-blue-300",
};

export function CrmStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        statusTone[normalized] ?? "border-slate-500/20 bg-slate-500/10 text-slate-300",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function CrmMetricCard({
  detail,
  icon: Icon,
  label,
  tone = "blue",
  value,
}: {
  detail?: string;
  icon: LucideIcon;
  label: string;
  tone?: "amber" | "blue" | "emerald" | "rose";
  value: number | string;
}) {
  const tones = {
    amber: "border-amber-500/15 bg-amber-500/[0.04] text-amber-300",
    blue: "border-blue-500/15 bg-blue-500/[0.04] text-blue-300",
    emerald: "border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-300",
    rose: "border-rose-500/15 bg-rose-500/[0.04] text-rose-300",
  } as const;

  return (
    <Card className={cn("p-5", tones[tone])}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p> : null}
    </Card>
  );
}

export function CrmEmptyState({
  actionHref,
  actionLabel,
  description,
  icon: Icon,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Card className="p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-700" />
      <h2 className="mt-4 font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
      {actionHref && actionLabel ? (
        <Link className="mt-5 inline-block" href={actionHref}>
          <Button type="button">{actionLabel}</Button>
        </Link>
      ) : null}
    </Card>
  );
}

export function CrmMessageBanner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      )}
      role={error ? "alert" : "status"}
    >
      {error || notice}
    </div>
  );
}
