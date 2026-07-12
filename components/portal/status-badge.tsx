import { cn } from "@/components/ui/core";

const tones = {
  positive: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-200",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-200",
  neutral: "border-zinc-600/50 bg-zinc-800/70 text-zinc-300",
} as const;

function inferTone(status: string): keyof typeof tones {
  const value = status.trim().toLowerCase();
  if (["delivered", "completed", "ready", "won", "paid", "active"].includes(value)) return "positive";
  if (["exception", "delivery_issue", "cancelled", "voided", "lost", "blocked", "overdue"].includes(value)) return "danger";
  if (["in_transit", "departed_origin", "customs", "arrived_destination", "out_for_delivery", "in_review", "on_hold"].includes(value)) return "warning";
  if (["pending", "received", "processed", "new", "qualified", "quoted", "open", "in_progress"].includes(value)) return "info";
  return "neutral";
}

export function StatusBadge({
  className,
  label,
  status,
  tone,
}: {
  className?: string;
  label?: string;
  status: string;
  tone?: keyof typeof tones;
}) {
  const display = label || status.replace(/_/g, " ");
  return (
    <span
      aria-label={`Status: ${display}`}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold capitalize",
        tones[tone ?? inferTone(status)],
        className,
      )}
    >
      {display}
    </span>
  );
}
