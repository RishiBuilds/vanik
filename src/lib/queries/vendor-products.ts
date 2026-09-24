import "server-only";
import { and, asc, desc, eq, inArray, like, ne, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCategoryTree } from "@/lib/queries/catalog";
import {
  PRODUCT_STATUSES,
  type InventoryFilter,
  type InventorySortKey,
  type ProductSortKey,
  type ProductStatusValue,
} from "@/components/vendor/products/shared";

const p = schema.products;
const v = schema.productVariants;

const agg = {
  minPrice: sql<number | null>`(select min(v.price) from product_variants v where v.product_id = "products"."id")`,
  maxPrice: sql<number | null>`(select max(v.price) from product_variants v where v.product_id = "products"."id")`,
  totalStock: sql<number>`coalesce((select sum(v.stock) from product_variants v where v.product_id = "products"."id"), 0)`,
  variantCount: sql<number>`(select count(*) from product_variants v where v.product_id = "products"."id")`,
  lowCount: sql<number>`(select count(*) from product_variants v where v.product_id = "products"."id" and v.stock > 0 and v.stock <= v.low_stock_threshold)`,
  outCount: sql<number>`(select count(*) from product_variants v where v.product_id = "products"."id" and v.stock <= 0)`,
  image: sql<string | null>`(select pi.url from product_images pi where pi.product_id = "products"."id" order by pi.position limit 1)`,
  categoryName: sql<string | null>`(select c.name from categories c where c.id = "products"."category_id")`,
};

export type VendorProductListParams = {
  status?: ProductStatusValue | "all";
  q?: string;
  category?: string;
  sort?: ProductSortKey;
  page?: number;
  perPage?: number;
};

export type VendorProductRow = {
  id: string;
  slug: string;
  title: string;
  status: ProductStatusValue;
  price: number;
  minPrice: number;
  maxPrice: number;
  compareAtPrice: number | null;
  totalStock: number;
  variantCount: number;
  lowCount: number;
  outCount: number;
  salesCount: number;
  image: string | null;
  categoryName: string | null;
  updatedAt: Date;
};

export async function getVendorProducts(storeId: string, params: VendorProductListParams = {}) {
  const perPage = params.perPage ?? 20;
  const base: SQL[] = [eq(p.storeId, storeId)];
  const q = params.q?.trim();
  if (q) {
    const pat = `%${q.replace(/[%_]/g, "")}%`;
    base.push(
      or(
        like(p.title, pat),
        sql`exists(select 1 from product_variants v where v.product_id = "products"."id" and v.sku like ${pat})`,
      )!,
    );
  }
  if (params.category) {
    base.push(
      or(
        eq(p.categoryId, params.category),
        sql`"products"."category_id" in (select c.id from categories c where c.parent_id = ${params.category})`,
      )!,
    );
  }
  const status = params.status && params.status !== "all" ? params.status : null;
  const where = and(...base, status ? eq(p.status, status) : undefined);

  const order = (() => {
    switch (params.sort) {
      case "title":
        return [asc(sql`lower(${p.title})`)];
      case "price-asc":
        return [asc(p.price), desc(p.updatedAt)];
      case "price-desc":
        return [desc(p.price), desc(p.updatedAt)];
      case "stock-asc":
        return [asc(agg.totalStock), desc(p.updatedAt)];
      case "stock-desc":
        return [desc(agg.totalStock), desc(p.updatedAt)];
      case "sales":
        return [desc(p.salesCount), desc(p.updatedAt)];
      default:
        return [desc(p.updatedAt)];
    }
  })();

  const [countRows, statusRows, totalRow] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(p).where(where),
    db
      .select({ status: p.status, n: sql<number>`count(*)` })
      .from(p)
      .where(and(...base))
      .groupBy(p.status),
    db.select({ n: sql<number>`count(*)` }).from(p).where(eq(p.storeId, storeId)),
  ]);
  const total = Number(countRows[0]?.n ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);

  const rows = await db
    .select({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      salesCount: p.salesCount,
      updatedAt: p.updatedAt,
      ...agg,
    })
    .from(p)
    .where(where)
    .orderBy(...order)
    .limit(perPage)
    .offset((page - 1) * perPage);

  const counts = { all: 0, active: 0, draft: 0, archived: 0 } as Record<ProductStatusValue | "all", number>;
  for (const r of statusRows) {
    if ((PRODUCT_STATUSES as readonly string[]).includes(r.status)) counts[r.status] = Number(r.n);
    counts.all += Number(r.n);
  }

  const items: VendorProductRow[] = rows.map((r) => ({
    ...r,
    minPrice: Number(r.minPrice ?? r.price),
    maxPrice: Number(r.maxPrice ?? r.price),
    totalStock: Number(r.totalStock),
    variantCount: Number(r.variantCount),
    lowCount: Number(r.lowCount),
    outCount: Number(r.outCount),
  }));

  return { items, total, page, pageCount, perPage, counts, storeTotal: Number(totalRow[0]?.n ?? 0) };
}

export async function getVendorCategoryFacets(storeId: string) {
  const rows = await db
    .select({ id: schema.categories.id, name: schema.categories.name, n: sql<number>`count(*)` })
    .from(p)
    .innerJoin(schema.categories, eq(schema.categories.id, p.categoryId))
    .where(eq(p.storeId, storeId))
    .groupBy(schema.categories.id, schema.categories.name)
    .orderBy(asc(schema.categories.name));
  return rows.map((r) => ({ id: r.id, name: r.name, count: Number(r.n) }));
}

export async function getVendorProduct(storeId: string, id: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(p.id, id), eq(p.storeId, storeId)),
    with: {
      images: { orderBy: asc(schema.productImages.position) },
      variants: { orderBy: asc(v.position) },
    },
  });
  return product ?? null;
}
export type VendorProductDetail = NonNullable<Awaited<ReturnType<typeof getVendorProduct>>>;

export type CategoryGroup = { id: string; name: string; children: { id: string; name: string }[] };

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const tree = await getCategoryTree();
  return tree
    .filter((t) => t.children.length > 0)
    .map((t) => ({ id: t.id, name: t.name, children: t.children.map((c) => ({ id: c.id, name: c.name })) }));
}

export type InventoryParams = {
  filter?: InventoryFilter;
  q?: string;
  sort?: InventorySortKey;
  page?: number;
  perPage?: number;
};

export type InventoryRow = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  lowStockThreshold: number;
  productId: string;
  productTitle: string;
  productStatus: ProductStatusValue;
  image: string | null;
};

export async function getInventory(storeId: string, params: InventoryParams = {}) {
  const perPage = params.perPage ?? 50;
  const base: SQL[] = [eq(p.storeId, storeId), ne(p.status, "archived")];
  const q = params.q?.trim();
  if (q) {
    const pat = `%${q.replace(/[%_]/g, "")}%`;
    base.push(or(like(p.title, pat), like(v.sku, pat))!);
  }
  const filterCond =
    params.filter === "low"
      ? sql`${v.stock} <= ${v.lowStockThreshold}`
      : params.filter === "out"
        ? sql`${v.stock} <= 0`
        : undefined;
  const where = and(...base, filterCond);

  const order = (() => {
    switch (params.sort) {
      case "stock-desc":
        return [desc(v.stock), asc(v.sku)];
      case "title":
        return [asc(sql`lower(${p.title})`), asc(v.position)];
      case "sku":
        return [asc(v.sku)];
      default:
        return [asc(v.stock), asc(v.sku)];
    }
  })();

  const storeWhere = and(eq(p.storeId, storeId), ne(p.status, "archived"));
  const [countRows, summaryRows, filteredCounts] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(v).innerJoin(p, eq(p.id, v.productId)).where(where),
    db
      .select({
        skus: sql<number>`count(*)`,
        low: sql<number>`coalesce(sum(case when ${v.stock} > 0 and ${v.stock} <= ${v.lowStockThreshold} then 1 else 0 end), 0)`,
        out: sql<number>`coalesce(sum(case when ${v.stock} <= 0 then 1 else 0 end), 0)`,
        units: sql<number>`coalesce(sum(case when ${v.stock} > 0 then ${v.stock} else 0 end), 0)`,
        value: sql<number>`coalesce(sum(case when ${v.stock} > 0 then ${v.stock} * ${v.price} else 0 end), 0)`,
      })
      .from(v)
      .innerJoin(p, eq(p.id, v.productId))
      .where(storeWhere),
    db
      .select({
        all: sql<number>`count(*)`,
        low: sql<number>`coalesce(sum(case when ${v.stock} <= ${v.lowStockThreshold} then 1 else 0 end), 0)`,
        out: sql<number>`coalesce(sum(case when ${v.stock} <= 0 then 1 else 0 end), 0)`,
      })
      .from(v)
      .innerJoin(p, eq(p.id, v.productId))
      .where(and(...base)),
  ]);
  const total = Number(countRows[0]?.n ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);

  const rows = await db
    .select({
      id: v.id,
      sku: v.sku,
      attributes: v.attributes,
      price: v.price,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      productId: p.id,
      productTitle: p.title,
      productStatus: p.status,
      image: sql<string | null>`(select pi.url from product_images pi where pi.product_id = ${p.id} order by pi.position limit 1)`,
    })
    .from(v)
    .innerJoin(p, eq(p.id, v.productId))
    .where(where)
    .orderBy(...order)
    .limit(perPage)
    .offset((page - 1) * perPage);

  const s = summaryRows[0];
  const fc = filteredCounts[0];
  return {
    items: rows as InventoryRow[],
    total,
    page,
    pageCount,
    summary: {
      skus: Number(s?.skus ?? 0),
      low: Number(s?.low ?? 0),
      out: Number(s?.out ?? 0),
      units: Number(s?.units ?? 0),
      value: Number(s?.value ?? 0),
    },
    counts: { all: Number(fc?.all ?? 0), low: Number(fc?.low ?? 0), out: Number(fc?.out ?? 0) } as Record<InventoryFilter, number>,
  };
}

export async function getOwnedVariantIds(storeId: string, ids: string[]) {
  if (!ids.length) return [];
  const rows = await db
    .select({ id: v.id })
    .from(v)
    .innerJoin(p, eq(p.id, v.productId))
    .where(and(eq(p.storeId, storeId), inArray(v.id, ids)));
  return rows.map((r) => r.id);
}
