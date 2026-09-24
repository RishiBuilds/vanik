import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, Plus, SearchX } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getVendorCategoryFacets, getVendorProducts } from "@/lib/queries/vendor-products";
import { cn, firstParam, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/account/page-header";
import { ListToolbar } from "@/components/vendor/products/list-toolbar";
import { ProductTable } from "@/components/vendor/products/product-table";
import { PRODUCT_SORTS, PRODUCT_STATUSES, STATUS_LABEL, type ProductSortKey, type ProductStatusValue } from "@/components/vendor/products/shared";

export const metadata: Metadata = { title: "Products · Seller" };

const TABS = ["all", ...PRODUCT_STATUSES] as const;
type Tab = (typeof TABS)[number];

export default async function VendorProductsPage(props: PageProps<"/vendor/products">) {
  const { store } = await requireVendor();
  const sp = await props.searchParams;
  const statusParam = firstParam(sp.status);
  const status: Tab = statusParam && (TABS as readonly string[]).includes(statusParam) ? (statusParam as Tab) : "all";
  const q = firstParam(sp.q)?.trim() || undefined;
  const category = firstParam(sp.category) || undefined;
  const sortParam = firstParam(sp.sort);
  const sort: ProductSortKey = PRODUCT_SORTS.some((s) => s.value === sortParam) ? (sortParam as ProductSortKey) : "updated";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const [result, facets] = await Promise.all([
    getVendorProducts(store.id, { status, q, category, sort, page }),
    getVendorCategoryFacets(store.id),
  ]);
  const params: Record<string, string | undefined> = {
    status: status === "all" ? undefined : status,
    q,
    category,
    sort: sort === "updated" ? undefined : sort,
  };
  const tabHref = (t: Tab) => {
    const s = new URLSearchParams();
    if (t !== "all") s.set("status", t);
    if (q) s.set("q", q);
    if (category) s.set("category", category);
    if (params.sort) s.set("sort", params.sort);
    const qs = s.toString();
    return `/vendor/products${qs ? `?${qs}` : ""}`;
  };
  const filtered = !!(q || category || status !== "all");
  const addButton = (
    <Button asChild>
      <Link href="/vendor/products/new">
        <Plus /> Add product
      </Link>
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Products"
        description={
          result.storeTotal
            ? `${formatNumber(result.storeTotal)} listing${result.storeTotal === 1 ? "" : "s"} in ${store.name}.`
            : "Everything you sell, in one place."
        }
        actions={addButton}
      />

      {result.storeTotal === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="List your first product"
          description="Add photos, set a price and stock, and it’s live in your storefront — or save it as a draft until you’re ready."
          action={addButton}
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <>
          <nav aria-label="Filter by status" className="scrollbar-none mb-5 flex gap-1.5 overflow-x-auto">
            {TABS.map((t) => (
              <Link
                key={t}
                href={tabHref(t)}
                aria-current={status === t ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm transition-colors",
                  status === t ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                )}
              >
                {t === "all" ? "All" : STATUS_LABEL[t as ProductStatusValue]}
                <span className={cn("text-xs tabular-nums", status === t ? "text-ink-inverse/70" : "text-ink-subtle")}>
                  {result.counts[t]}
                </span>
              </Link>
            ))}
          </nav>

          <Card className="overflow-hidden">
            <ListToolbar
              key={`${q ?? ""}|${category ?? ""}|${sort}`}
              className="border-b-2 border-line p-4 sm:px-6"
              params={params}
              searchPlaceholder="Search by title or SKU"
              selects={[
                {
                  name: "category",
                  label: "Filter by category",
                  value: category ?? "",
                  options: [{ value: "", label: "All categories" }, ...facets.map((f) => ({ value: f.id, label: `${f.name} (${f.count})` }))],
                },
                {
                  name: "sort",
                  label: "Sort products",
                  value: sort === "updated" ? "" : sort,
                  options: PRODUCT_SORTS.map((s) => ({ value: s.value === "updated" ? "" : s.value, label: s.label })),
                },
              ]}
            />
            {result.items.length === 0 ? (
              <EmptyState
                compact
                icon={SearchX}
                title="No products match"
                description={
                  q ? (
                    <>
                      Nothing matches “{q}”{status !== "all" ? ` in ${STATUS_LABEL[status as ProductStatusValue].toLowerCase()}` : ""}. Try another title or SKU.
                    </>
                  ) : (
                    "Try a different status or category."
                  )
                }
                action={
                  filtered ? (
                    <Button asChild variant="outline">
                      <Link href="/vendor/products">Clear filters</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ProductTable rows={result.items} />
            )}
            {result.total > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-line px-5 py-3 text-xs text-ink-subtle sm:flex-row sm:px-6">
                <span className="tabular-nums">
                  Showing {(result.page - 1) * result.perPage + 1}–{Math.min(result.page * result.perPage, result.total)} of {result.total}
                </span>
                <Pagination page={result.page} pageCount={result.pageCount} basePath="/vendor/products" params={params} />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
