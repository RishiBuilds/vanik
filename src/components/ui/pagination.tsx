import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const list = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1]! > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  pageCount,
  basePath,
  params,
  className,
  pageParam = "page",
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  className?: string;
  pageParam?: string;
}) {
  if (pageCount <= 1) return null;
  const href = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === pageParam || v == null) continue;
      (Array.isArray(v) ? v : [v]).forEach((x) => sp.append(k, x));
    }
    if (n > 1) sp.set(pageParam, String(n));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const item = "inline-flex h-10 min-w-10 items-center justify-center rounded-base border-2 px-3 font-heading text-sm font-bold tabular-nums transition-all";
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "gap-1 border-border bg-secondary-background text-ink shadow-xs hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none")} rel="prev">
          <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className={cn(item, "gap-1 border-transparent text-ink-subtle opacity-50")} aria-disabled>
          <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
        </span>
      )}
      {pages(page, pageCount).map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className={cn(item, "border-transparent text-ink-subtle")}>
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(item, n === page ? "border-border bg-main text-main-foreground shadow-xs" : "border-transparent text-ink hover:border-border hover:bg-muted")}
          >
            {n}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "gap-1 border-border bg-secondary-background text-ink shadow-xs hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none")} rel="next">
          <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "gap-1 border-transparent text-ink-subtle opacity-50")} aria-disabled>
          <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
