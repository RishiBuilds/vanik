"use client";

import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { SORTS } from "@/lib/sorts";
import { cn, formatMoney, formatNumber } from "@/lib/utils";

const rupees = (v: string) => formatMoney(Math.round(Number(v) * 100));
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { useBrowse } from "./browse-context";
import { Filters, type FilterFacets } from "./filters";

type Chip = { key: string; value?: string; label: string };

export function BrowseToolbar({
  total,
  facets,
  showCategory = true,
  showStores = true,
  lockedKeys = [],
}: {
  total: number;
  facets: FilterFacets;
  showCategory?: boolean;
  showStores?: boolean;
  lockedKeys?: string[];
}) {
  const { params, update, clearAll, pending } = useBrowse();
  const view = params.get("view") === "list" ? "list" : "grid";
  const sort = params.get("sort") ?? "relevance";

  const labelFor = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;
  const chips: Chip[] = [
    ...(params.get("category") && !lockedKeys.includes("category")
      ? [{ key: "category", label: labelFor(facets.categories, params.get("category")!) }]
      : []),
    ...params.getAll("store").map((v) => ({ key: "store", value: v, label: labelFor(facets.stores, v) })),
    ...params.getAll("color").map((v) => ({ key: "color", value: v, label: v })),
    ...params.getAll("size").map((v) => ({ key: "size", value: v, label: `Size ${v}` })),
    ...(params.get("min") || params.get("max")
      ? [{ key: "price", label: params.get("min") && params.get("max") ? `${rupees(params.get("min")!)} – ${rupees(params.get("max")!)}` : params.get("min") ? `${rupees(params.get("min")!)}+` : `Under ${rupees(params.get("max")!)}` }]
      : []),
    ...(params.get("rating") ? [{ key: "rating", label: `${params.get("rating")}★ & up` }] : []),
    ...(params.get("stock") === "1" ? [{ key: "stock", label: "In stock" }] : []),
    ...(params.get("sale") === "1" ? [{ key: "sale", label: "On sale" }] : []),
  ];

  const removeChip = (c: Chip) => {
    if (c.key === "price") return update({ min: null, max: null });
    if (c.value) return update({ [c.key]: params.getAll(c.key).filter((x) => x !== c.value) });
    update({ [c.key]: null });
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal /> Filters
                {chips.length > 0 && (
                  <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-ink text-2xs text-ink-inverse">
                    {chips.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <SheetContent
              title="Filters"
              side="left"
              footer={
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearAll} disabled={chips.length === 0}>
                    Clear all
                  </Button>
                  <DialogClose asChild>
                    <Button className="flex-1" loading={pending}>
                      Show {formatNumber(total)} results
                    </Button>
                  </DialogClose>
                </div>
              }
            >
              <div className="p-5">
                <Filters facets={facets} showCategory={showCategory} showStores={showStores} />
              </div>
            </SheetContent>
          </Dialog>
          <p className="text-sm text-ink-muted" aria-live="polite">
            <span className="font-medium text-ink">{formatNumber(total)}</span> {total === 1 ? "result" : "results"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <Select
            id="sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value === "relevance" ? null : e.target.value })}
            className="w-44 [&_select]:h-9 [&_select]:text-xs sm:w-52 sm:[&_select]:text-sm"
          >
            {Object.entries(SORTS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
          <div className="hidden rounded-md border-2 border-line-strong p-0.5 sm:flex" role="group" aria-label="View">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update({ view: v === "grid" ? null : v }, { keepPage: true })}
                aria-pressed={view === v}
                aria-label={v === "grid" ? "Grid view" : "List view"}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-sm transition-colors",
                  view === v ? "bg-main text-main-foreground" : "text-ink-subtle hover:text-ink",
                )}
              >
                {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value ?? ""}`}
              type="button"
              onClick={() => removeChip(c)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted pl-3 pr-2 text-xs font-medium transition-colors hover:bg-sunken"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label} <X className="size-3.5 text-ink-subtle" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="ml-1 text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
