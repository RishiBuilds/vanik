import { cn } from "@/lib/utils";

export type ContentBlock = { type: "p"; text: string } | { type: "list"; items: string[] } | { type: "steps"; items: string[] };

export function ContentBlocks({ blocks, className }: { blocks: ContentBlock[]; className?: string }) {
  return (
    <div className={cn("space-y-4 text-base leading-relaxed text-ink-muted", className)}>
      {blocks.map((b, i) => {
        if (b.type === "p") return <p key={i}>{b.text}</p>;
        if (b.type === "list")
          return (
            <ul key={i} className="space-y-2 pl-1">
              {b.items.map((it) => (
                <li key={it} className="flex gap-3">
                  <span className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        return (
          <ol key={i} className="space-y-3">
            {b.items.map((it, n) => (
              <li key={it} className="flex gap-3.5">
                <span
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-line-strong bg-surface text-xs font-semibold tabular-nums text-ink"
                  aria-hidden
                >
                  {n + 1}
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}
