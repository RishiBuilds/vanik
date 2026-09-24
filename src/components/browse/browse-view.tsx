import Link from "next/link";
import { SearchX } from "lucide-react";
import { browseProducts, type BrowseParams } from "@/lib/queries/catalog";
import { getMyFavoriteIds } from "@/lib/queries/account";
import type { SearchParams } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ProductGrid, ProductRow } from "@/components/shop/product-card";
import { BrowseProvider, BrowseResults } from "./browse-context";
import { BrowseToolbar } from "./toolbar";
import { Filters } from "./filters";

export async function BrowseView({
  query,
  view,
  searchParams,
  basePath,
  showCategory = true,
  showStores = true,
  lockedKeys = [],
  gridClassName,
}: {
  query: BrowseParams;
  view: "grid" | "list";
  searchParams: SearchParams;
  basePath: string;
  showCategory?: boolean;
  showStores?: boolean;
  lockedKeys?: string[];
  gridClassName?: string;
}) {
  const [result, favs] = await Promise.all([browseProducts(query), getMyFavoriteIds()]);
  const hasFilters = Boolean(
    query.stores?.length || query.colors?.length || query.sizes?.length || query.minPrice || query.maxPrice || query.rating || query.inStock || query.onSale,
  );

  return (
    <BrowseProvider lockedKeys={lockedKeys}>
      <div className="grid gap-10 lg:grid-cols-[15.5rem_1fr] xl:gap-14">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto pb-8 pr-1">
            <Filters facets={result.facets} showCategory={showCategory} showStores={showStores} />
          </div>
        </aside>
        <div className="min-w-0">
          <BrowseToolbar total={result.total} facets={result.facets} showCategory={showCategory} showStores={showStores} lockedKeys={lockedKeys} />
          <BrowseResults>
            {result.items.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={query.q ? `No matches for “${query.q}”` : "Nothing matches those filters"}
                description={
                  hasFilters
                    ? "Try removing a filter or widening your price range."
                    : "Check the spelling, or try a broader search like “mug”, “jacket” or “serum”."
                }
                action={
                  <>
                    {hasFilters && (
                      <Button asChild variant="outline">
                        <Link href={query.q ? `${basePath}?q=${encodeURIComponent(query.q)}` : basePath}>Clear filters</Link>
                      </Button>
                    )}
                    <Button asChild>
                      <Link href="/search?sort=bestselling">Browse bestsellers</Link>
                    </Button>
                  </>
                }
                className="rounded-xl border-2 border-dashed border-line-strong"
              />
            ) : view === "list" ? (
              <div className="space-y-3">
                {result.items.map((p) => (
                  <ProductRow key={p.id} product={p} favorited={favs.has(p.id)} />
                ))}
              </div>
            ) : (
              <ProductGrid products={result.items} favorites={favs} priorityCount={4} className={gridClassName ?? "md:grid-cols-3 xl:grid-cols-3"} />
            )}
            <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} params={searchParams} className="mt-14" />
          </BrowseResults>
        </div>
      </div>
    </BrowseProvider>
  );
}

export function BrowseSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[15.5rem_1fr] xl:gap-14">
      <div className="hidden space-y-6 lg:block">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 border-b-2 border-line pb-5">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div>
        <div className="mb-6 flex justify-between">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-9 w-52 rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--muted)_0%,var(--sunken)_50%,var(--muted)_100%)] bg-[length:200%_100%]" />
              <div className="mt-3 h-3 w-20 rounded bg-muted" />
              <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
