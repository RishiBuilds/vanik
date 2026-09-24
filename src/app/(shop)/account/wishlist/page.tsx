import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Heart, Store } from "lucide-react";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getProductCardsByIds } from "@/lib/queries/catalog";
import { cn, firstParam } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/account/page-header";
import { ProductGrid } from "@/components/shop/product-card";
import { StoreCard } from "@/components/shop/store-card";
import { FollowButton } from "@/components/shop/follow-button";
import { storeCardSelect } from "@/lib/queries/stores";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage(props: PageProps<"/account/wishlist">) {
  const user = await requireUser("/account/wishlist");
  const tab = firstParam((await props.searchParams).tab) === "shops" ? "shops" : "items";
  const [favRows, followRows] = await Promise.all([
    db.select({ id: schema.favorites.productId }).from(schema.favorites).where(eq(schema.favorites.userId, user.id)).orderBy(desc(schema.favorites.createdAt)),
    db
      .select(storeCardSelect)
      .from(schema.stores)
      .innerJoin(schema.storeFollows, eq(schema.storeFollows.storeId, schema.stores.id))
      .where(eq(schema.storeFollows.userId, user.id)),
  ]);
  const products = tab === "items" ? await getProductCardsByIds(favRows.map((r) => r.id)) : [];
  const favSet = new Set(favRows.map((r) => r.id));
  const shops = followRows.map((r) => ({ ...r, productCount: Number(r.productCount), previewImages: JSON.parse(r.previewImages || "[]") as string[] }));

  const tabCls = (active: boolean) =>
    cn("inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-4 text-sm transition-colors", active ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40");

  return (
    <div>
      <PageHeader title="Wishlist" description="Things you’ve saved and shops you follow." />
      <nav aria-label="Wishlist sections" className="mb-8 flex gap-1.5">
        <Link href="/account/wishlist" className={tabCls(tab === "items")} aria-current={tab === "items" ? "true" : undefined}>
          Saved items <span className="text-xs opacity-70">{favRows.length}</span>
        </Link>
        <Link href="/account/wishlist?tab=shops" className={tabCls(tab === "shops")} aria-current={tab === "shops" ? "true" : undefined}>
          Followed shops <span className="text-xs opacity-70">{shops.length}</span>
        </Link>
      </nav>

      {tab === "items" ? (
        products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any product to save it here for later."
            action={
              <Button asChild>
                <Link href="/search?sort=bestselling">Discover bestsellers</Link>
              </Button>
            }
            className="rounded-xl border-2 border-line bg-surface"
          />
        ) : (
          <ProductGrid products={products} favorites={favSet} className="md:grid-cols-3 xl:grid-cols-4" />
        )
      ) : shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title="You’re not following any shops"
          description="Follow shops to hear about new drops and restocks first."
          action={
            <Button asChild>
              <Link href="/stores">Browse shops</Link>
            </Button>
          }
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shops.map((s) => (
            <div key={s.id} className="relative">
              <StoreCard store={s} />
              <div className="absolute right-4 top-4">
                <FollowButton storeId={s.id} storeName={s.name} initial size="xs" variant="outline" className="bg-surface/95 backdrop-blur" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
