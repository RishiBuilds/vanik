import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, CircleAlert, DollarSign, PackageCheck, PackageX, Plus, SearchX, TriangleAlert } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getInventory } from "@/lib/queries/vendor-products";
import { cn, firstParam, formatMoney, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader, StatCard } from "@/components/account/page-header";
import { InventoryTable } from "@/components/vendor/products/inventory-table";
import { ListToolbar } from "@/components/vendor/products/list-toolbar";
import { INVENTORY_FILTERS, INVENTORY_SORTS, type InventoryFilter, type InventorySortKey } from "@/components/vendor/products/shared";

export const metadata: Metadata = { title: "Inventory · Seller" };

export default async function InventoryPage(props: PageProps<"/vendor/inventory">) {
  const { store } = await requireVendor();
  const sp = await props.searchParams;
  const f = firstParam(sp.filter);
  const filter: InventoryFilter = f && f in INVENTORY_FILTERS ? (f as InventoryFilter) : "all";
  const q = firstParam(sp.q)?.trim() || undefined;
  const s = firstParam(sp.sort);
  const sort: InventorySortKey = INVENTORY_SORTS.some((x) => x.value === s) ? (s as InventorySortKey) : "stock-asc";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const inv = await getInventory(store.id, { filter, q, sort, page });
  const params: Record<string, string | undefined> = {
    filter: filter === "all" ? undefined : filter,
    q,
    sort: sort === "stock-asc" ? undefined : sort,
  };
  const tabHref = (t: InventoryFilter) => {
    const u = new URLSearchParams();
    if (t !== "all") u.set("filter", t);
    if (q) u.set("q", q);
    if (params.sort) u.set("sort", params.sort);
    const qs = u.toString();
    return `/vendor/inventory${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock for every SKU across your active and draft listings."
        actions={
          <Button asChild variant="outline">
            <Link href="/vendor/products">Manage products</Link>
          </Button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Total SKUs" value={formatNumber(inv.summary.skus)} icon={<Boxes />} />
        <StatCard
          label="Low stock"
          value={<span className={cn(inv.summary.low > 0 && "text-warning")}>{formatNumber(inv.summary.low)}</span>}
          hint="At or below alert level"
          icon={<TriangleAlert />}
        />
        <StatCard
          label="Out of stock"
          value={<span className={cn(inv.summary.out > 0 && "text-danger")}>{formatNumber(inv.summary.out)}</span>}
          hint={inv.summary.out ? "Can’t be purchased" : "Everything’s buyable"}
          icon={<PackageX />}
        />
        <StatCard label="Units on hand" value={formatNumber(inv.summary.units)} icon={<PackageCheck />} />
        <StatCard
          label="Inventory value"
          value={formatMoney(inv.summary.value)}
          hint="At retail price"
          icon={<DollarSign />}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {inv.summary.skus === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No inventory yet"
          description="Once you add products, every variant’s stock shows up here."
          action={
            <Button asChild>
              <Link href="/vendor/products/new">
                <Plus /> Add product
              </Link>
            </Button>
          }
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <>
          <nav aria-label="Filter inventory" className="scrollbar-none mb-5 flex gap-1.5 overflow-x-auto">
            {(Object.keys(INVENTORY_FILTERS) as InventoryFilter[]).map((t) => (
              <Link
                key={t}
                href={tabHref(t)}
                aria-current={filter === t ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm transition-colors",
                  filter === t ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                )}
              >
                {t === "low" && <CircleAlert className={cn("size-3.5", filter === t ? "" : "text-warning")} aria-hidden />}
                {INVENTORY_FILTERS[t]}
                <span className={cn("text-xs tabular-nums", filter === t ? "text-ink-inverse/70" : "text-ink-subtle")}>{inv.counts[t]}</span>
              </Link>
            ))}
          </nav>

          <Card className="overflow-hidden">
            <ListToolbar
              key={`${q ?? ""}|${sort}`}
              className="border-b-2 border-line p-4 sm:px-6"
              params={params}
              searchPlaceholder="Search by SKU or product"
              selects={[
                {
                  name: "sort",
                  label: "Sort inventory",
                  value: sort === "stock-asc" ? "" : sort,
                  options: INVENTORY_SORTS.map((x) => ({ value: x.value === "stock-asc" ? "" : x.value, label: x.label })),
                },
              ]}
            />
            {inv.items.length === 0 ? (
              <EmptyState
                compact
                icon={filter === "all" || q ? SearchX : PackageCheck}
                title={q ? "No SKUs match" : filter === "out" ? "Nothing is out of stock" : filter === "low" ? "Stock levels look healthy" : "No SKUs"}
                description={
                  q
                    ? `Nothing matches “${q}”. Try a different SKU or product name.`
                    : "Every SKU is above its low-stock alert level. Nice."
                }
                action={
                  <Button asChild variant="outline">
                    <Link href="/vendor/inventory">View all SKUs</Link>
                  </Button>
                }
              />
            ) : (
              <InventoryTable rows={inv.items} />
            )}
            {inv.pageCount > 1 && (
              <div className="border-t-2 border-line px-5 py-3 sm:px-6">
                <Pagination page={inv.page} pageCount={inv.pageCount} basePath="/vendor/inventory" params={params} />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
