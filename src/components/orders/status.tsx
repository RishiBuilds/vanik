import { Check, CircleX, MapPin } from "lucide-react";
import type { FulfillmentStatus } from "@/lib/db/schema";
import { FULFILLMENT_FLOW, STATUS_META } from "@/lib/services/shipping";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, size = "md" }: { status: FulfillmentStatus; size?: "sm" | "md" }) {
  const meta = STATUS_META[status];
  const tone = meta.tone === "neutral" ? "neutral" : meta.tone;
  return (
    <Badge tone={tone} size={size} dot>
      {meta.label}
    </Badge>
  );
}

type Event = { id: string; status: FulfillmentStatus; note: string | null; location: string | null; createdAt: Date };

export function TrackingTimeline({ status, events }: { status: FulfillmentStatus; events: Event[] }) {
  if (status === "cancelled") {
    const cancel = events.find((e) => e.status === "cancelled");
    return (
      <div className="flex gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
        <CircleX className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">Cancelled{cancel ? ` · ${formatDateTime(cancel.createdAt)}` : ""}</p>
          {cancel?.note && <p className="mt-0.5 text-danger/80">{cancel.note}</p>}
        </div>
      </div>
    );
  }
  const currentIdx = FULFILLMENT_FLOW.indexOf(status);
  return (
    <ol className="relative">
      {FULFILLMENT_FLOW.map((st, i) => {
        const ev = [...events].reverse().find((e) => e.status === st);
        const reached = i <= currentIdx;
        const current = i === currentIdx;
        const last = i === FULFILLMENT_FLOW.length - 1;
        return (
          <li key={st} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn("absolute left-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-px", i < currentIdx ? "bg-ink" : "bg-sunken")}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 inline-flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border-2",
                reached ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong bg-surface",
                current && status !== "delivered" && "ring-4 ring-accent/20",
              )}
            >
              {reached && <Check className="size-3" strokeWidth={3} />}
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-medium", !reached && "text-ink-subtle")}>{STATUS_META[st].label}</p>
              {reached && ev ? (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-subtle">
                  <time dateTime={new Date(ev.createdAt).toISOString()}>{formatDateTime(ev.createdAt)}</time>
                  {ev.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {ev.location}
                    </span>
                  )}
                </p>
              ) : (
                current && <p className="mt-0.5 text-xs text-ink-subtle">{STATUS_META[st].description}</p>
              )}
              {ev?.note && <p className="mt-1 text-xs text-ink-muted">{ev.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusProgress({ status }: { status: FulfillmentStatus }) {
  if (status === "cancelled") return null;
  const idx = FULFILLMENT_FLOW.indexOf(status);
  return (
    <div className="flex gap-1" aria-hidden>
      {FULFILLMENT_FLOW.map((s, i) => (
        <span key={s} className={cn("h-1 flex-1 rounded-full", i <= idx ? (status === "delivered" ? "bg-success" : "bg-ink") : "bg-muted")} />
      ))}
    </div>
  );
}
