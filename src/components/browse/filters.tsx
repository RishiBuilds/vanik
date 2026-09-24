"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import type { Facet } from "@/lib/queries/catalog";
import { swatch } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Checkbox, Switch } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { useBrowse } from "./browse-context";

export type FilterFacets = {
  stores: Facet[];
  categories: Facet[];
  colors: Facet[];
  sizes: Facet[];
  price: { min: number; max: number };
};

function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <fieldset className="border-b-2 border-line py-5 first:pt-0 last:border-0">
      <legend className="contents">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          {title}
          <span className="text-lg font-light leading-none text-ink-subtle" aria-hidden>
            {open ? "−" : "+"}
          </span>
        </button>
      </legend>
      {open && <div className="mt-3.5">{children}</div>}
    </fieldset>
  );
}

const PRICE_PRESETS = [
  { label: "Under ₹1,000", min: null, max: "1000" },
  { label: "₹1,000 – ₹3,000", min: "1000", max: "3000" },
  { label: "₹3,000 – ₹10,000", min: "3000", max: "10000" },
  { label: "₹10,000+", min: "10000", max: null },
];

export function Filters({
  facets,
  showCategory = true,
  showStores = true,
}: {
  facets: FilterFacets;
  showCategory?: boolean;
  showStores?: boolean;
}) {
  const { params, update, toggleValue } = useBrowse();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [showAllStores, setShowAllStores] = useState(false);
  const stores = params.getAll("store");
  const colors = params.getAll("color");
  const sizes = params.getAll("size");
  const category = params.get("category");
  const rating = params.get("rating");

  const storeList = showAllStores ? facets.stores : facets.stores.slice(0, 6);

  return (
    <div className="text-sm">
      {showCategory && facets.categories.length > 1 && (
        <Group title="Category">
          <ul className="space-y-1">
            {facets.categories.slice(0, 10).map((c) => (
              <li key={c.value}>
                <button
                  type="button"
                  onClick={() => update({ category: category === c.value ? null : c.value })}
                  className={cn(
                    "-mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted",
                    category === c.value && "bg-muted font-medium",
                  )}
                  aria-pressed={category === c.value}
                >
                  <span className="flex items-center gap-2">
                    {category === c.value && <Check className="size-3.5" />}
                    {c.label}
                  </span>
                  <span className="text-xs tabular-nums text-ink-subtle">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </Group>
      )}

      <Group title="Price">
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((p) => {
            const active = (params.get("min") ?? null) === p.min && (params.get("max") ?? null) === p.max;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMin(active ? "" : (p.min ?? ""));
                  setMax(active ? "" : (p.max ?? ""));
                  update({ min: active ? null : p.min, max: active ? null : p.max });
                }}
                className={cn(
                  "h-8 rounded-full border-2 px-3 text-xs transition-colors",
                  active ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <form
          className="mt-3.5 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <label className="flex-1">
            <span className="mb-1 block text-xs text-ink-subtle">Min</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder={String(Math.floor(facets.price.min / 100))}
                className="h-9 w-full rounded-md border-2 border-line-strong bg-surface pl-6 pr-2 text-sm focus:border-ink focus:outline-none"
              />
            </span>
          </label>
          <span className="pb-2 text-ink-subtle">–</span>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-ink-subtle">Max</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder={String(Math.ceil(facets.price.max / 100))}
                className="h-9 w-full rounded-md border-2 border-line-strong bg-surface pl-6 pr-2 text-sm focus:border-ink focus:outline-none"
              />
            </span>
          </label>
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Go
          </Button>
        </form>
      </Group>

      <Group title="Rating">
        <div className="space-y-1">
          {[4, 3].map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={rating === String(r)}
              onClick={() => update({ rating: rating === String(r) ? null : String(r) })}
              className={cn(
                "-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
                rating === String(r) && "bg-muted font-medium",
              )}
            >
              <span className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className={cn("size-3.5", i < r ? "text-main" : "text-sunken")} fill="currentColor" stroke="var(--line)" strokeWidth={1.5} />
                ))}
              </span>
              & up
            </button>
          ))}
        </div>
      </Group>

      {facets.colors.length > 0 && (
        <Group title="Color">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const hex = swatch(c.value);
              const active = colors.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleValue("color", c.value)}
                  aria-pressed={active}
                  title={`${c.label} (${c.count})`}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border-2 pl-1 pr-3 text-xs transition-colors",
                    active ? "border-ink bg-muted font-medium" : "border-line hover:border-line-strong",
                  )}
                >
                  <span
                    className="size-6 rounded-full border-2 border-black/10"
                    style={{ background: hex ?? "conic-gradient(#d9ccb4, #9fae8e, #4b6a88, #a24a26, #d9ccb4)" }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.sizes.length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((s) => {
              const active = sizes.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleValue("size", s.value)}
                  aria-pressed={active}
                  className={cn(
                    "h-9 min-w-11 rounded-md border-2 px-2.5 text-xs font-medium transition-colors",
                    active ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {showStores && facets.stores.length > 1 && (
        <Group title="Shop">
          <ul className="space-y-2.5">
            {storeList.map((s) => (
              <li key={s.value}>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <Checkbox checked={stores.includes(s.value)} onCheckedChange={() => toggleValue("store", s.value)} />
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="text-xs tabular-nums text-ink-subtle">{s.count}</span>
                </label>
              </li>
            ))}
          </ul>
          {facets.stores.length > 6 && (
            <button type="button" onClick={() => setShowAllStores(!showAllStores)} className="mt-3 text-xs font-medium underline underline-offset-4">
              {showAllStores ? "Show fewer" : `Show all ${facets.stores.length}`}
            </button>
          )}
        </Group>
      )}

      <Group title="Availability">
        <div className="space-y-3.5">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            In stock only
            <Switch checked={params.get("stock") === "1"} onCheckedChange={(v) => update({ stock: v ? "1" : null })} />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            On sale
            <Switch checked={params.get("sale") === "1"} onCheckedChange={(v) => update({ sale: v ? "1" : null })} />
          </label>
        </div>
      </Group>
    </div>
  );
}
