"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";

type Params = Record<string, string | undefined>;

export function ListToolbar({
  params,
  searchPlaceholder,
  selects,
  className,
}: {
  params: Params;
  searchPlaceholder: string;
  selects: { name: string; label: string; value: string; options: { value: string; label: string }[] }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.q ?? "");

  const push = (patch: Params) => {
    const sp = new URLSearchParams();
    const next = { ...params, ...patch };
    delete next.page;
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
    const qs = sp.toString();
    start(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  };

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          push({ q: q.trim() || undefined });
        }}
      >
        <label htmlFor="list-search" className="sr-only">
          {searchPlaceholder}
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
        <input
          id="list-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-md border-2 border-line-strong bg-surface pl-9 pr-10 text-sm text-ink shadow-xs placeholder:text-ink-subtle hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-3 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
          {pending ? (
            <Spinner className="mr-1 size-4" />
          ) : q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                push({ q: undefined });
              }}
              className="inline-flex size-7 items-center justify-center rounded-sm text-ink-subtle hover:bg-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </span>
      </form>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        {selects.map((s) => (
          <div key={s.name} className="min-w-0 sm:w-48">
            <label htmlFor={`list-${s.name}`} className="sr-only">
              {s.label}
            </label>
            <Select
              id={`list-${s.name}`}
              value={s.value}
              onChange={(e) => push({ [s.name]: e.target.value || undefined })}
              className="[&_select]:h-10"
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
