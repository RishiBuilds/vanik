import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { products: p, stores: s, categories: c, productVariants: v, productImages, reviews } = schema;



export type CategoryNode = { id: string; slug: string; name: string; image: string | null; description: string | null; children: CategoryNode[] };

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const rows = await db.select().from(c).orderBy(asc(c.position));
  const byParent = new Map<string | null, typeof rows>();
  for (const r of rows) byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  const build = (parentId: string | null): CategoryNode[] =>
    (byParent.get(parentId) ?? []).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      image: r.image,
      description: r.description,
      children: build(r.id),
    }));
  return build(null);
});

export const getCategoryBySlug = cache(async (slug: string) => {
  const tree = await getCategoryTree();
  for (const top of tree) {
    if (top.slug === slug) return { category: top, parent: null as CategoryNode | null };
    const child = top.children.find((ch) => ch.slug === slug);
    if (child) return { category: child, parent: top };
  }
  return null;
});



const imageAt = (offset: number) =>
  sql<string | null>`(select url from product_images pi where pi.product_id = ${p.id} order by pi.position limit 1 offset ${sql.raw(String(offset))})`;

export const productCardSelect = {
  id: p.id,
  slug: p.slug,
  title: p.title,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  rating: p.rating,
  reviewCount: p.reviewCount,
  salesCount: p.salesCount,
  createdAt: p.createdAt,
  tags: p.tags,
  summary: p.summary,
  storeName: s.name,
  storeSlug: s.slug,
  image: imageAt(0),
  image2: imageAt(1),
  inStock: sql<number>`exists(select 1 from product_variants v where v.product_id = ${p.id} and v.stock > 0)`,
  variantCount: sql<number>`(select count(*) from product_variants v where v.product_id = ${p.id})`,
  defaultVariantId: sql<string | null>`(select v.id from product_variants v where v.product_id = ${p.id} order by v.position limit 1)`,
};

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  salesCount: number;
  createdAt: Date;
  tags: string[];
  summary: string;
  storeName: string;
  storeSlug: string;
  image: string | null;
  image2: string | null;
  inStock: boolean;
  variantCount: number;
  defaultVariantId: string | null;
};

function toCard(r: Record<string, unknown>): ProductCardData {
  return { ...(r as ProductCardData), inStock: Boolean(r.inStock), variantCount: Number(r.variantCount) };
}

function cardsQuery(...conds: (SQL | undefined)[]) {
  return db
    .select(productCardSelect)
    .from(p)
    .innerJoin(s, eq(s.id, p.storeId))
    .where(and(eq(p.status, "active"), eq(s.status, "active"), ...conds));
}

export async function getProductCardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db
    .select(productCardSelect)
    .from(p)
    .innerJoin(s, eq(s.id, p.storeId))
    .where(and(inArray(p.id, ids), eq(p.status, "active")));
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => byId.get(id)).filter((x): x is ProductCardData => !!x);
}

export const getFeaturedProducts = cache(async (limit = 8) =>
  (await cardsQuery().orderBy(desc(p.featured), desc(p.salesCount)).limit(limit)).map(toCard),
);

export const getTrendingProducts = cache(async (limit = 8) => {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db
    .select({ id: schema.orderItems.productId, units: sql<number>`sum(${schema.orderItems.quantity})` })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(gte(schema.orders.createdAt, since))
    .groupBy(schema.orderItems.productId)
    .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
    .limit(limit * 2);
  const cards = await getProductCardsByIds(rows.map((r) => r.id!).filter(Boolean));
  return cards.slice(0, limit);
});

export const getNewArrivals = cache(async (limit = 8) => (await cardsQuery().orderBy(desc(p.createdAt)).limit(limit)).map(toCard));

export const getOnSale = cache(async (limit = 8) =>
  (
    await db
      .select(productCardSelect)
      .from(p)
      .innerJoin(s, eq(s.id, p.storeId))
      .where(and(eq(p.status, "active"), sql`${p.compareAtPrice} > ${p.price}`))
      .orderBy(desc(p.salesCount))
      .limit(limit)
  ).map(toCard),
);



export { SORTS, type SortKey } from "@/lib/sorts";
import type { SortKey } from "@/lib/sorts";

export type BrowseParams = {
  q?: string;
  category?: string;
  stores?: string[];
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;

  storeId?: string;
};

export type Facet = { value: string; label: string; count: number };
export type BrowseResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  facets: { stores: Facet[]; categories: Facet[]; colors: Facet[]; sizes: Facet[]; price: { min: number; max: number } };
};

const COLOR_KEYS = ["Color", "Glaze", "Finish"];
const SIZE_KEYS = ["Size", "Waist"];

function attrExists(keys: string[], values: string[]) {
  return sql`exists (select 1 from product_variants v2, json_each(v2.attributes) j where v2.product_id = ${p.id} and j.key in ${keys} and j.value in ${values})`;
}

async function categoryIdsFor(slug: string) {
  const found = await getCategoryBySlug(slug);
  if (!found) return null;
  return [found.category.id, ...found.category.children.map((ch) => ch.id)];
}


export async function browseProducts(params: BrowseParams): Promise<BrowseResult> {
  const perPage = params.perPage ?? 24;
  const page = Math.max(1, params.page ?? 1);

  const base: SQL[] = [eq(p.status, "active"), eq(s.status, "active")];
  const terms = (params.q ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const t of terms) {
    const like = `%${t.replace(/[%_]/g, "")}%`;
    base.push(
      or(
        sql`lower(${p.title}) like ${like}`,
        sql`lower(${p.summary}) like ${like}`,
        sql`lower(${p.tags}) like ${like}`,
        sql`lower(${s.name}) like ${like}`,
        sql`lower(${c.name}) like ${like}`,
      )!,
    );
  }
  if (params.storeId) base.push(eq(p.storeId, params.storeId));

  let catIds: string[] | null = null;
  if (params.category) {
    catIds = await categoryIdsFor(params.category);
    if (catIds) base.push(inArray(p.categoryId, catIds));
  }

  const filters: SQL[] = [];
  if (params.stores?.length) filters.push(inArray(s.slug, params.stores));
  if (params.minPrice != null) filters.push(gte(p.price, params.minPrice));
  if (params.maxPrice != null) filters.push(lte(p.price, params.maxPrice));
  if (params.rating) filters.push(gte(p.rating, params.rating));
  if (params.inStock) filters.push(sql`exists(select 1 from product_variants v where v.product_id = ${p.id} and v.stock > 0)`);
  if (params.onSale) filters.push(sql`${p.compareAtPrice} > ${p.price}`);
  if (params.colors?.length) filters.push(attrExists(COLOR_KEYS, params.colors));
  if (params.sizes?.length) filters.push(attrExists(SIZE_KEYS, params.sizes));

  const where = and(...base, ...filters);
  const baseWhere = and(...base);

  const sort = params.sort ?? "relevance";
  const titleHit = terms.length ? sql`(case when lower(${p.title}) like ${`%${terms[0]}%`} then 0 else 1 end)` : null;
  const orderBy =
    sort === "price_asc"
      ? [asc(p.price)]
      : sort === "price_desc"
        ? [desc(p.price)]
        : sort === "newest"
          ? [desc(p.createdAt)]
          : sort === "rating"
            ? [desc(p.rating), desc(p.reviewCount)]
            : sort === "bestselling"
              ? [desc(p.salesCount)]
              : [...(titleHit ? [asc(titleHit)] : []), desc(p.featured), desc(p.salesCount)];

  const from = () => db.select(productCardSelect).from(p).innerJoin(s, eq(s.id, p.storeId)).innerJoin(c, eq(c.id, p.categoryId));

  const [rows, [{ total }], storeFacet, catFacet, colorFacet, sizeFacet, [range]] = await Promise.all([
    from()
      .where(where)
      .orderBy(...orderBy, asc(p.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ total: sql<number>`count(*)` })
      .from(p)
      .innerJoin(s, eq(s.id, p.storeId))
      .innerJoin(c, eq(c.id, p.categoryId))
      .where(where),
    db
      .select({ value: s.slug, label: s.name, count: sql<number>`count(*)` })
      .from(p)
      .innerJoin(s, eq(s.id, p.storeId))
      .innerJoin(c, eq(c.id, p.categoryId))
      .where(baseWhere)
      .groupBy(s.id)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ value: c.slug, label: c.name, count: sql<number>`count(*)` })
      .from(p)
      .innerJoin(s, eq(s.id, p.storeId))
      .innerJoin(c, eq(c.id, p.categoryId))
      .where(baseWhere)
      .groupBy(c.id)
      .orderBy(desc(sql`count(*)`)),
    attrFacet(COLOR_KEYS, baseWhere),
    attrFacet(SIZE_KEYS, baseWhere),
    db
      .select({ min: sql<number>`coalesce(min(${p.price}), 0)`, max: sql<number>`coalesce(max(${p.price}), 0)` })
      .from(p)
      .innerJoin(s, eq(s.id, p.storeId))
      .innerJoin(c, eq(c.id, p.categoryId))
      .where(baseWhere),
  ]);

  return {
    items: rows.map(toCard),
    total: Number(total),
    page,
    pageCount: Math.max(1, Math.ceil(Number(total) / perPage)),
    facets: {
      stores: storeFacet.map((f) => ({ ...f, count: Number(f.count) })),
      categories: catFacet.map((f) => ({ ...f, count: Number(f.count) })),
      colors: colorFacet,
      sizes: sortSizes(sizeFacet),
      price: { min: Number(range?.min ?? 0), max: Number(range?.max ?? 0) },
    },
  };
}

async function attrFacet(keys: string[], baseWhere: SQL | undefined): Promise<Facet[]> {
  const rows = await db
    .select({ value: sql<string>`j.value`, count: sql<number>`count(distinct ${p.id})` })
    .from(p)
    .innerJoin(s, eq(s.id, p.storeId))
    .innerJoin(c, eq(c.id, p.categoryId))
    .innerJoin(v, eq(v.productId, p.id))
    .innerJoin(sql`json_each(${v.attributes}) j`, sql`1 = 1`)
    .where(and(baseWhere, sql`j.key in ${keys}`))
    .groupBy(sql`j.value`)
    .orderBy(desc(sql`count(distinct ${p.id})`));
  return rows.map((r) => ({ value: r.value, label: r.value, count: Number(r.count) }));
}

const SIZE_ORDER = ["XS", "S", "S/M", "M", "M/L", "L", "XL"];
function sortSizes(f: Facet[]) {
  return [...f].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.value);
    const bi = SIZE_ORDER.indexOf(b.value);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    const an = parseFloat(a.value.replace(/^\D+/, ""));
    const bn = parseFloat(b.value.replace(/^\D+/, ""));
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return a.value.localeCompare(b.value);
  });
}



export async function getSuggestions(q: string) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return { products: [], stores: [], categories: [] };
  const like = `%${term.replace(/[%_]/g, "")}%`;
  const [prods, sts, cats] = await Promise.all([
    db
      .select({ slug: p.slug, title: p.title, price: p.price, image: imageAt(0), storeName: s.name })
      .from(p)
      .innerJoin(s, eq(s.id, p.storeId))
      .where(and(eq(p.status, "active"), or(sql`lower(${p.title}) like ${like}`, sql`lower(${p.tags}) like ${like}`)))
      .orderBy(asc(sql`instr(lower(${p.title}), ${term}) = 0`), desc(p.salesCount))
      .limit(5),
    db
      .select({ slug: s.slug, name: s.name, logo: s.logo, tagline: s.tagline })
      .from(s)
      .where(and(eq(s.status, "active"), sql`lower(${s.name}) like ${like}`))
      .limit(3),
    db
      .select({ slug: c.slug, name: c.name })
      .from(c)
      .where(sql`lower(${c.name}) like ${like}`)
      .limit(3),
  ]);
  return { products: prods, stores: sts, categories: cats };
}



export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.query.products.findFirst({
    where: eq(p.slug, slug),
    with: {
      images: { orderBy: asc(productImages.position) },
      variants: { orderBy: asc(v.position) },
      store: true,
      category: { with: { parent: true } },
    },
  });
  if (!product || product.status === "archived") return null;
  return product;
});
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(productId: string, categoryId: string, storeId: string, limit = 8) {
  const [sameCategory, sameStore] = await Promise.all([
    cardsQuery(eq(p.categoryId, categoryId), ne(p.id, productId))
      .orderBy(desc(p.salesCount))
      .limit(limit),
    cardsQuery(eq(p.storeId, storeId), ne(p.id, productId))
      .orderBy(desc(p.salesCount))
      .limit(limit),
  ]);
  let similar = sameCategory.map(toCard);
  if (similar.length < 4) {
    const parent = await db.query.categories.findFirst({ where: eq(c.id, categoryId) });
    if (parent?.parentId) {
      const siblings = await db.select({ id: c.id }).from(c).where(eq(c.parentId, parent.parentId));
      const more = await cardsQuery(inArray(p.categoryId, siblings.map((x) => x.id)), ne(p.id, productId))
        .orderBy(desc(p.salesCount))
        .limit(limit);
      const seen = new Set(similar.map((x) => x.id));
      similar = [...similar, ...more.map(toCard).filter((x) => !seen.has(x.id))].slice(0, limit);
    }
  }
  return { similar, fromStore: sameStore.map(toCard) };
}

export type ReviewSort = "recent" | "helpful" | "highest" | "lowest";

export async function getProductReviews(productId: string, opts: { sort?: ReviewSort; rating?: number; page?: number; perPage?: number } = {}) {
  const perPage = opts.perPage ?? 6;
  const page = Math.max(1, opts.page ?? 1);
  const conds = [eq(reviews.productId, productId), ...(opts.rating ? [eq(reviews.rating, opts.rating)] : [])];
  const order =
    opts.sort === "helpful"
      ? [desc(reviews.helpfulCount)]
      : opts.sort === "highest"
        ? [desc(reviews.rating), desc(reviews.createdAt)]
        : opts.sort === "lowest"
          ? [asc(reviews.rating), desc(reviews.createdAt)]
          : [desc(reviews.createdAt)];
  const [items, breakdownRows, [{ total }]] = await Promise.all([
    db.query.reviews.findMany({
      where: and(...conds),
      with: { user: { columns: { name: true, image: true } } },
      orderBy: order,
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    db
      .select({ rating: reviews.rating, count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .groupBy(reviews.rating),
    db.select({ total: sql<number>`count(*)` }).from(reviews).where(and(...conds)),
  ]);
  const breakdown = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: Number(breakdownRows.find((b) => b.rating === r)?.count ?? 0) }));
  return { items, breakdown, total: Number(total), page, pageCount: Math.max(1, Math.ceil(Number(total) / perPage)) };
}

export async function trackProductView(productId: string) {
  await db.update(p).set({ viewCount: sql`${p.viewCount} + 1` }).where(eq(p.id, productId));
}
