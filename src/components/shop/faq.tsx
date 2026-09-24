import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqList({ items, className }: { items: { q: string; a: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y-2 border-line", className)}>
      {items.map((it) => (
        <details key={it.q} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-base font-medium text-ink transition-colors hover:text-accent-ink [&::-webkit-details-marker]:hidden">
            {it.q}
            <Plus
              className="mt-1 size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <div className="-mt-1 max-w-2xl pb-6 pr-10 text-sm leading-relaxed text-ink-muted">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
