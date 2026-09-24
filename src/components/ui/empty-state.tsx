import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-6 py-10" : "px-6 py-16 sm:py-20", className)}>
      <div className="relative mb-5">
        <div className="relative flex size-14 -rotate-3 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow">
          <Icon className="size-6 text-main-foreground" strokeWidth={2} />
        </div>
      </div>
      <h3 className="font-display text-xl font-bold tracking-tightish text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
