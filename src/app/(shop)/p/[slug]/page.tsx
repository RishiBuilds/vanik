import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { BadgeCheck, MapPin, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { db, schema } from "@/lib/db";
import { getProductBySlug, getProductReviews, getRelatedProducts, trackProductView, type ReviewSort } from "@/lib/queries/catalog";
import { getMyFavoriteIds, getMyFollowedStoreIds } from "@/lib/queries/account";
import { getSessionUser } from "@/lib/session";
import { estimateDelivery } from "@/lib/services/shipping";
import { firstParam, formatDateShort, formatMoney, formatNumber } from "@/lib/utils";
import { Rating } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, SectionHeader } from "@/components/shop/section";
import { ProductGrid } from "@/components/shop/product-card";
import { StoreLogo } from "@/components/shop/store-card";
import { FollowButton } from "@/components/shop/follow-button";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ReviewsSection } from "@/components/product/reviews-section";

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await props.params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.summary,
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage(props: PageProps<"/p/[slug]">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const user = await getSessionUser();
  const isOwner = user?.id === product.store.ownerId;
  if (product.status !== "active" && !isOwner) notFound();

  const sort = (["recent", "helpful", "highest", "lowest"].includes(firstParam(searchParams.rsort) ?? "")
    ? firstParam(searchParams.rsort)
    : "recent") as ReviewSort;
  const filterRating = Number(firstParam(searchParams.rrating)) || undefined;
  const rpage = Number(firstParam(searchParams.rpage)) || 1;

  const [reviews, related, favs, follows, rates, purchased, myReview] = await Promise.all([
    getProductReviews(product.id, { sort, rating: filterRating, page: rpage }),
    getRelatedProducts(product.id, product.categoryId, product.storeId),
    getMyFavoriteIds(),
    getMyFollowedStoreIds(),
    db.query.shippingRates.findMany({ where: and(eq(schema.shippingRates.storeId, product.storeId), eq(schema.shippingRates.active, true)) }),
    user
      ? db
          .select({ id: schema.orderItems.id })
          .from(schema.orderItems)
          .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
          .where(and(eq(schema.orders.userId, user.id), eq(schema.orderItems.productId, product.id)))
          .limit(1)
      : Promise.resolve([]),
    user ? db.query.reviews.findFirst({ where: and(eq(schema.reviews.userId, user.id), eq(schema.reviews.productId, product.id)) }) : Promise.resolve(undefined),
  ]);
  after(() => trackProductView(product.id));

  const eligibility = !user
    ? ({ state: "signed-out" } as const)
    : myReview
      ? ({ state: "reviewed", review: { rating: myReview.rating, title: myReview.title, body: myReview.body } } as const)
      : purchased.length
        ? ({ state: "can-review" } as const)
        : ({ state: "not-purchased" } as const);

  const standard = rates.filter((r) => r.zone === "Domestic").sort((a, b) => a.price - b.price)[0];
  const now = new Date();
  const arrival = standard ? `${formatDateShort(estimateDelivery(now, standard.minDays + 1))} – ${formatDateShort(estimateDelivery(now, standard.maxDays + 2))}` : null;
  const cat = product.category;
  const store = product.store;

  return (
    <div className="container-page pt-6 lg:pt-8">
      {product.status !== "active" && (
        <div className="mb-6 rounded-lg border-2 border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          This product is a <strong>{product.status}</strong> and only visible to you.{" "}
          <Link href={`/vendor/products/${product.id}`} className="font-medium underline underline-offset-4">
            Edit in dashboard
          </Link>
        </div>
      )}
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          ...(cat.parent ? [{ href: `/c/${cat.parent.slug}`, label: cat.parent.name }] : []),
          { href: `/c/${cat.slug}`, label: cat.name },
          { label: product.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
        <Gallery images={product.images} title={product.title} />

        <div className="lg:sticky lg:top-36 lg:self-start">
          <Link href={`/s/${store.slug}`} className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink">
            {store.name} {store.verified && <BadgeCheck className="size-4 text-info" aria-label="Verified shop" />}
          </Link>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[1.1] tracking-display sm:text-[2.75rem]">{product.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {product.reviewCount > 0 ? (
              <a href="#reviews" className="hover:opacity-80">
                <Rating value={product.rating} count={product.reviewCount} showValue />
              </a>
            ) : (
              <span className="text-xs text-ink-subtle">No reviews yet</span>
            )}
            {product.salesCount > 20 && <span className="text-xs text-ink-subtle">{formatNumber(product.salesCount)} sold</span>}
            {product.tags.includes("handmade") && <Badge tone="accent" size="sm">Handmade</Badge>}
          </div>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">{product.summary}</p>

          <div className="mt-7 border-t-2 border-line pt-7">
            <PurchasePanel
              productId={product.id}
              title={product.title}
              options={product.options}
              variants={product.variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                attributes: v.attributes,
                price: v.price,
                compareAtPrice: v.compareAtPrice,
                stock: v.stock,
                lowStockThreshold: v.lowStockThreshold,
              }))}
              favorited={favs.has(product.id)}
            />
          </div>

          <ul className="mt-7 divide-y divide-line rounded-lg border-2 border-line bg-surface text-sm">
            <li className="flex gap-3 px-4 py-3.5">
              <Truck className="mt-0.5 size-[1.125rem] shrink-0 text-ink-subtle" />
              <div>
                {arrival ? (
                  <p>
                    Arrives <span className="font-medium">{arrival}</span> with {standard!.name.toLowerCase()} shipping
                  </p>
                ) : (
                  <p>Ships from {store.location}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-subtle">
                  {standard?.freeOver ? `Free over ${formatMoney(standard.freeOver)} from this shop · ` : ""}
                  {store.policies.processingTime}
                </p>
              </div>
            </li>
            <li className="flex gap-3 px-4 py-3.5">
              <RotateCcw className="mt-0.5 size-[1.125rem] shrink-0 text-ink-subtle" />
              <p className="line-clamp-2">{store.policies.returns}</p>
            </li>
            <li className="flex gap-3 px-4 py-3.5">
              <ShieldCheck className="mt-0.5 size-[1.125rem] shrink-0 text-ink-subtle" />
              <p>Vanik buyer protection on every order</p>
            </li>
          </ul>


          <div className="mt-6 rounded-xl border-2 border-line bg-surface p-5">
            <div className="flex items-center gap-4">
              <StoreLogo src={store.logo} name={store.name} size={52} className="ring-0" />
              <div className="min-w-0 flex-1">
                <Link href={`/s/${store.slug}`} className="flex items-center gap-1.5 font-semibold hover:underline hover:underline-offset-4">
                  <span className="truncate">{store.name}</span>
                  {store.verified && <BadgeCheck className="size-4 shrink-0 text-info" aria-label="Verified shop" />}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-subtle">
                  {store.reviewCount > 0 && <Rating value={store.rating} size="xs" showValue />}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" /> {store.location}
                  </span>
                  <span>{formatNumber(store.followerCount)} followers</span>
                </p>
              </div>
              {!isOwner && <FollowButton storeId={store.id} storeName={store.name} initial={follows.has(store.id)} variant="outline" />}
            </div>
            <p className="mt-4 line-clamp-2 text-sm text-ink-muted">{store.tagline}</p>
            <Link href={`/s/${store.slug}`} className="mt-3 inline-block text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              Visit shop
            </Link>
          </div>
        </div>
      </div>


      <section className="mt-20 max-w-3xl" aria-label="Product details">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="shipping">Shipping &amp; returns</TabsTrigger>
          </TabsList>
          <TabsContent value="description">
            <div className="space-y-4 text-base leading-relaxed text-ink-muted">
              {product.description.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="specs">
            {product.specs.length ? (
              <dl className="divide-y divide-line rounded-lg border-2 border-line bg-surface">
                {product.specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[10rem_1fr] gap-4 px-5 py-3.5 text-sm sm:grid-cols-[14rem_1fr]">
                    <dt className="text-ink-subtle">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">The shop hasn’t listed detailed specifications yet.</p>
            )}
          </TabsContent>
          <TabsContent value="shipping">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Shipping</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{store.policies.shipping}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {rates.map((r) => (
                    <li key={r.id} className="flex justify-between gap-4 border-b-2 border-line pb-2">
                      <span>
                        {r.name} <span className="text-ink-subtle">· {r.carrier} · {r.minDays}–{r.maxDays} days</span>
                      </span>
                      <span className="tabular-nums">{formatMoney(r.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Returns</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{store.policies.returns}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <div className="mt-20 border-t-2 border-line pt-16">
        <ReviewsSection
          data={reviews}
          rating={product.rating}
          reviewCount={product.reviewCount}
          basePath={`/p/${product.slug}`}
          searchParams={searchParams}
          sort={sort}
          filterRating={filterRating}
          storeName={store.name}
          eligibility={eligibility}
          product={{ id: product.id, title: product.title }}
        />
      </div>

      {related.similar.length > 0 && (
        <section className="mt-24">
          <SectionHeader title="You may also like" href={`/c/${cat.slug}`} linkLabel={`More in ${cat.name}`} />
          <ProductGrid products={related.similar.slice(0, 4)} favorites={favs} />
        </section>
      )}
      {related.fromStore.length > 0 && (
        <section className="mt-20">
          <SectionHeader title={`More from ${store.name}`} href={`/s/${store.slug}`} linkLabel="Visit shop" />
          <ProductGrid products={related.fromStore.slice(0, 4)} favorites={favs} />
        </section>
      )}
    </div>
  );
}
