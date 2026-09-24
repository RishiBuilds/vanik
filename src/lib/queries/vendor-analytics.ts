import "server-only";
import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const DAY = 86_400_000;
const { storeOrders: so, orderItems: oi, storeDailyStats: st } = schema;

export const RANGES = { 7: "Last 7 days", 30: "Last 30 days", 90: "Last 90 days" } as const;
export type RangeDays = keyof typeof RANGES;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function periodTotals(storeId: string, from: Date, to: Date) {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${so.subtotal}), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(so)
    .where(and(eq(so.storeId, storeId), ne(so.status, "cancelled"), gte(so.createdAt, from), lt(so.createdAt, to)));
  const [traffic] = await db
    .select({ visits: sql<number>`coalesce(sum(${st.visits}), 0)` })
    .from(st)
    .where(and(eq(st.storeId, storeId), gte(st.date, dayKey(from)), lt(st.date, dayKey(to))));
  const revenue = Number(row?.revenue ?? 0);
  const orders = Number(row?.orders ?? 0);
  const visits = Number(traffic?.visits ?? 0);
  return { revenue, orders, visits, aov: orders ? Math.round(revenue / orders) : 0, conversion: visits ? orders / visits : 0 };
}

export type KPI = { value: number; prev: number; delta: number | null };
const kpi = (value: number, prev: number): KPI => ({ value, prev, delta: prev ? (value - prev) / prev : null });

export async function getVendorOverview(storeId: string, range: RangeDays) {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY);
  const start = new Date(end.getTime() - range * DAY);
  const prevStart = new Date(start.getTime() - range * DAY);

  const [cur, prev, dailyOrders, dailyStats, topProducts, recent, lowStock, reviewStats] = await Promise.all([
    periodTotals(storeId, start, end),
    periodTotals(storeId, prevStart, start),
    db
      .select({
        day: sql<string>`strftime('%Y-%m-%d', ${so.createdAt} / 1000, 'unixepoch')`,
        revenue: sql<number>`coalesce(sum(${so.subtotal}), 0)`,
        orders: sql<number>`count(*)`,
      })
      .from(so)
      .where(and(eq(so.storeId, storeId), ne(so.status, "cancelled"), gte(so.createdAt, start), lt(so.createdAt, end)))
      .groupBy(sql`1`),
    db
      .select({ day: st.date, visits: st.visits, views: st.productViews, sources: st.sources })
      .from(st)
      .where(and(eq(st.storeId, storeId), gte(st.date, dayKey(start)), lt(st.date, dayKey(end)))),
    db
      .select({
        productId: oi.productId,
        title: oi.title,
        image: sql<string | null>`max(${oi.image})`,
        slug: sql<string | null>`(select slug from products where products.id = ${oi.productId})`,
        units: sql<number>`sum(${oi.quantity})`,
        revenue: sql<number>`sum(${oi.quantity} * ${oi.unitPrice})`,
      })
      .from(oi)
      .innerJoin(so, eq(so.id, oi.storeOrderId))
      .where(and(eq(so.storeId, storeId), ne(so.status, "cancelled"), gte(so.createdAt, start), lt(so.createdAt, end)))
      .groupBy(oi.productId)
      .orderBy(desc(sql`sum(${oi.quantity} * ${oi.unitPrice})`))
      .limit(5),
    db.query.storeOrders.findMany({
      where: eq(so.storeId, storeId),
      orderBy: desc(so.createdAt),
      limit: 6,
      with: { order: { columns: { number: true, shippingAddress: true }, with: { user: { columns: { name: true, image: true } } } }, items: { columns: { quantity: true } } },
    }),
    db
      .select({
        id: schema.productVariants.id,
        sku: schema.productVariants.sku,
        stock: schema.productVariants.stock,
        threshold: schema.productVariants.lowStockThreshold,
        attributes: schema.productVariants.attributes,
        productId: schema.products.id,
        title: schema.products.title,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(and(eq(schema.products.storeId, storeId), ne(schema.products.status, "archived"), sql`${schema.productVariants.stock} <= ${schema.productVariants.lowStockThreshold}`))
      .orderBy(schema.productVariants.stock)
      .limit(5),
    db
      .select({
        avg: sql<number>`coalesce(avg(${schema.reviews.rating}), 0)`,
        count: sql<number>`count(*)`,
        unanswered: sql<number>`sum(case when ${schema.reviews.vendorResponse} is null then 1 else 0 end)`,
        recent: sql<number>`sum(case when ${schema.reviews.createdAt} >= ${start.getTime()} then 1 else 0 end)`,
      })
      .from(schema.reviews)
      .where(eq(schema.reviews.storeId, storeId)),
  ]);

  const ordersByDay = new Map(dailyOrders.map((d) => [d.day, d]));
  const statsByDay = new Map(dailyStats.map((d) => [d.day, d]));
  const series = Array.from({ length: range }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY);
    const key = dayKey(date);
    const o = ordersByDay.get(key);
    const s = statsByDay.get(key);
    return { date: key, revenue: Number(o?.revenue ?? 0), orders: Number(o?.orders ?? 0), visits: s?.visits ?? 0 };
  });

  const sources = dailyStats.reduce(
    (acc, d) => ({
      direct: acc.direct + d.sources.direct,
      search: acc.search + d.sources.search,
      social: acc.social + d.sources.social,
      referral: acc.referral + d.sources.referral,
    }),
    { direct: 0, search: 0, social: 0, referral: 0 },
  );
  const productViews = dailyStats.reduce((s, d) => s + d.views, 0);

  const [rs] = reviewStats;
  return {
    range,
    kpis: {
      revenue: kpi(cur.revenue, prev.revenue),
      orders: kpi(cur.orders, prev.orders),
      aov: kpi(cur.aov, prev.aov),
      visits: kpi(cur.visits, prev.visits),
      conversion: kpi(cur.conversion, prev.conversion),
    },
    productViews,
    series,
    sources,
    topProducts: topProducts.map((t) => ({ ...t, units: Number(t.units), revenue: Number(t.revenue) })),
    recent,
    lowStock,
    reviews: { avg: Number(rs?.avg ?? 0), count: Number(rs?.count ?? 0), unanswered: Number(rs?.unanswered ?? 0), recent: Number(rs?.recent ?? 0) },
  };
}
export type VendorOverview = Awaited<ReturnType<typeof getVendorOverview>>;
