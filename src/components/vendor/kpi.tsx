import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { KPI } from "@/lib/queries/vendor-analytics";
import { cn } from "@/lib/utils";

export function Delta({ kpi, period, invert }: { kpi: KPI; period: string; invert?: boolean }) {
  if (kpi.delta == null) return <span className="text-xs text-ink-subtle">No data for the previous {period}</span>;
  const pct = kpi.delta * 100;
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const good = invert ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={cn("inline-flex items-center gap-0.5 font-medium", flat ? "text-ink-muted" : good ? "text-success" : "text-danger")}>
        <Icon className="size-3.5" aria-hidden />
        {flat ? "0%" : `${up ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`}
      </span>
      <span className="text-ink-subtle">vs previous {period}</span>
    </span>
  );
}

export function KpiTile({ label, value, kpi, period, invert }: { label: string; value: string; kpi: KPI; period: string; invert?: boolean }) {
  return (
    <div className="rounded-xl border-2 border-line bg-surface p-5">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tightish tabular-nums">{value}</p>
      <div className="mt-1.5">
        <Delta kpi={kpi} period={period} invert={invert} />
      </div>
    </div>
  );
}
