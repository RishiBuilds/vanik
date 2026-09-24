import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { stores: s } = schema;

export const storeCardSelect = {
  id: s.id,
  slug: s.slug,
  name: s.name,
  tagline: s.tagline,
  logo: s.logo,
  banner: s.banner,
  location: s.location,
  rating: s.rating,
  reviewCount: s.reviewCount,
  followerCount: s.followerCount,
  verified: s.verified,
  brandColor: s.brandColor,
  productCount: sql<number>`(select count(*) from products p where p.store_id = "stores"."id" and p.status = 'active')`,
  previewImages: sql<string>`(select json_group_array(url) from (select pi.url from products p join product_images pi on pi.product_id = p.id and pi.position = 0 where p.store_id = "stores"."id" and p.status = 'active' order by p.sales_count desc limit 3))`,
};

export type StoreCardData = Omit<Awaited<ReturnType<typeof getFeaturedStores>>[number], never>;

function mapStore<T extends { previewImages: string; productCount: number }>(r: T) {
  return { ...r, productCount: Number(r.productCount), previewImages: JSON.parse(r.previewImages || "[]") as string[] };
}

export const getFeaturedStores = cache(async (limit = 6) => {
  const rows = await db
    .select(storeCardSelect)
    .from(s)
    .where(and(eq(s.status, "active"), eq(s.featured, true)))
    .orderBy(desc(s.salesCount))
    .limit(limit);
  return rows.map(mapStore);
});

export const getAllStores = cache(async (sort: "popular" | "rating" | "newest" | "name" = "popular") => {
  const order =
    sort === "rating" ? [desc(s.rating)] : sort === "newest" ? [desc(s.createdAt)] : sort === "name" ? [asc(s.name)] : [desc(s.salesCount)];
  const rows = await db.select(storeCardSelect).from(s).where(eq(s.status, "active")).orderBy(...order);
  return rows.map(mapStore);
});

export const getMarketplaceStats = cache(async () => {
  const [row] = await db
    .select({
      stores: sql<number>`(select count(*) from stores where status = 'active')`,
      products: sql<number>`(select count(*) from products where status = 'active')`,
      rating: sql<number>`(select round(avg(rating), 1) from reviews)`,
      reviews: sql<number>`(select count(*) from reviews)`,
    })
    .from(sql`(select 1)`);
  return { stores: Number(row!.stores), products: Number(row!.products), rating: Number(row!.rating), reviews: Number(row!.reviews) };
});

export const getStoreBySlug = cache(async (slug: string) => {
  const store = await db.query.stores.findFirst({
    where: eq(s.slug, slug),
    with: { category: true, shippingRates: { where: eq(schema.shippingRates.active, true) }, owner: { columns: { name: true, image: true } } },
  });
  if (!store) return null;
  const [[{ productCount }], recentReviews] = await Promise.all([
    db
      .select({ productCount: sql<number>`count(*)` })
      .from(schema.products)
      .where(and(eq(schema.products.storeId, store.id), eq(schema.products.status, "active"))),
    db.query.reviews.findMany({
      where: eq(schema.reviews.storeId, store.id),
      with: { user: { columns: { name: true, image: true } }, product: { columns: { title: true, slug: true } } },
      orderBy: [desc(schema.reviews.rating), desc(schema.reviews.createdAt)],
      limit: 3,
    }),
  ]);
  return { ...store, productCount: Number(productCount), recentReviews };
});
