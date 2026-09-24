import type { Metadata } from "next";
import Link from "next/link";
import { getAllStores } from "@/lib/queries/stores";
import { cn, firstParam } from "@/lib/utils";
import { StoreCard } from "@/components/shop/store-card";
import { Breadcrumbs } from "@/components/shop/section";

export const metadata: Metadata = { title: "All shops" };

const SORTS = { popular: "Most popular", rating: "Top rated", newest: "Newest", name: "A–Z" } as const;

export default async function StoresPage(props: PageProps<"/stores">) {
  const sp = await props.searchParams;
  const sortParam = firstParam(sp.sort);
  const sort = (sortParam && sortParam in SORTS ? sortParam : "popular") as keyof typeof SORTS;
  const stores = await getAllStores(sort);

  return (
    <div className="container-page pt-8 lg:pt-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shops" }]} />
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display font-bold text-4xl tracking-display sm:text-5xl">Independent shops</h1>
          <p className="mt-3 max-w-xl text-base text-ink-muted">
            {stores.length} makers and small brands, each independently owned and run. Follow the ones you love to hear about new drops.
          </p>
        </div>
        <nav aria-label="Sort shops" className="flex flex-wrap gap-1.5">
          {Object.entries(SORTS).map(([k, label]) => (
            <Link
              key={k}
              href={k === "popular" ? "/stores" : `/stores?sort=${k}`}
              aria-current={sort === k ? "true" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full border-2 px-4 text-sm transition-colors",
                sort === k ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </div>
    </div>
  );
}
