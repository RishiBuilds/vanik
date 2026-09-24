import "server-only";
import { and, asc, desc, eq, isNotNull, isNull, ne, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

export type CustomerSort = "spent" | "orders" | "recent";

export type VendorCustomer = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  orders: number;
  spent: number;
  firstOrder: number;
  lastOrder: number;
};

async function getAllCustomers(storeId: string): Promise<VendorCustomer[]> {
  const so = schema.storeOrders;
  const o = schema.orders;
  const u = schema.user;
  const rows = await db
    .select({
      userId: o.userId,
      name: u.name,
      email: u.email,
      image: u.image,
      orders: sql<number>`count(distinct ${so.id})`,
      spent: sql<number>`coalesce(sum(${so.subtotal}), 0)`,
      firstOrder: sql<number>`min(${o.createdAt})`,
      lastOrder: sql<number>`max(${o.createdAt})`,
    })
    .from(so)
    .innerJoin(o, eq(o.id, so.orderId))
    .innerJoin(u, eq(u.id, o.userId))
    .where(and(eq(so.storeId, storeId), ne(so.status, "cancelled")))
    .groupBy(o.userId, u.name, u.email, u.image);
  return rows.map((r) => ({
    ...r,
    orders: Number(r.orders),
    spent: Number(r.spent),
    firstOrder: Number(r.firstOrder),
    lastOrder: Number(r.lastOrder),
  }));
}

export async function getVendorCustomers(
  storeId: string,
  opts: { q?: string; sort?: CustomerSort; page?: number; perPage?: number } = {},
) {
  const all = await getAllCustomers(storeId);
  const now = Date.now();
  const totalSpent = all.reduce((s, c) => s + c.spent, 0);
  const kpis = {
    total: all.length,
    repeatRate: all.length ? all.filter((c) => c.orders >= 2).length / all.length : 0,
    avgLifetimeValue: all.length ? Math.round(totalSpent / all.length) : 0,
    newLast30: all.filter((c) => c.firstOrder >= now - 30 * DAY).length,
  };

  const q = opts.q?.trim().toLowerCase();
  let list = q ? all.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : all;
  const sort = opts.sort ?? "spent";
  list = [...list].sort((a, b) =>
    sort === "orders" ? b.orders - a.orders || b.spent - a.spent : sort === "recent" ? b.lastOrder - a.lastOrder : b.spent - a.spent,
  );
  const perPage = opts.perPage ?? 12;
  const pageCount = Math.max(1, Math.ceil(list.length / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  return { kpis, items: list.slice((page - 1) * perPage, page * perPage), total: list.length, page, pageCount };
}

export async function getTopLocations(storeId: string, limit = 6) {
  const so = schema.storeOrders;
  const o = schema.orders;
  const city = sql<string>`json_extract(${o.shippingAddress}, '$.city')`;
  const region = sql<string>`json_extract(${o.shippingAddress}, '$.region')`;
  const rows = await db
    .select({
      city,
      region,
      customers: sql<number>`count(distinct ${o.userId})`,
      orders: sql<number>`count(distinct ${so.id})`,
    })
    .from(so)
    .innerJoin(o, eq(o.id, so.orderId))
    .where(and(eq(so.storeId, storeId), ne(so.status, "cancelled")))
    .groupBy(city, region)
    .orderBy(desc(sql`count(distinct ${so.id})`))
    .limit(limit);
  return rows.map((r) => ({ city: r.city ?? "Unknown", region: r.region ?? "", customers: Number(r.customers), orders: Number(r.orders) }));
}

export type ReviewFilter = "all" | "unanswered" | "answered";
export type VendorReviewSort = "newest" | "lowest";

export async function getReviewSummary(storeId: string) {
  const r = schema.reviews;
  const rows = await db
    .select({ rating: r.rating, n: sql<number>`count(*)`, answered: sql<number>`sum(case when ${r.vendorResponse} is not null then 1 else 0 end)` })
    .from(r)
    .where(eq(r.storeId, storeId))
    .groupBy(r.rating);
  const breakdown = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: Number(rows.find((x) => x.rating === rating)?.n ?? 0) }));
  const total = breakdown.reduce((s, b) => s + b.count, 0);
  const answered = rows.reduce((s, x) => s + Number(x.answered ?? 0), 0);
  const average = total ? breakdown.reduce((s, b) => s + b.rating * b.count, 0) / total : 0;
  return {
    total,
    average,
    breakdown,
    answered,
    unanswered: total - answered,
    responseRate: total ? answered / total : 0,
  };
}

export async function getVendorReviews(
  storeId: string,
  opts: { filter?: ReviewFilter; rating?: number; sort?: VendorReviewSort; page?: number; perPage?: number } = {},
) {
  const r = schema.reviews;
  const conds: SQL[] = [eq(r.storeId, storeId)];
  if (opts.filter === "unanswered") conds.push(isNull(r.vendorResponse));
  if (opts.filter === "answered") conds.push(isNotNull(r.vendorResponse));
  if (opts.rating && opts.rating >= 1 && opts.rating <= 5) conds.push(eq(r.rating, opts.rating));
  const where = and(...conds);
  const [{ n }] = (await db.select({ n: sql<number>`count(*)` }).from(r).where(where)) as [{ n: number }];
  const total = Number(n);
  const perPage = opts.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const items = await db.query.reviews.findMany({
    where,
    orderBy: opts.sort === "lowest" ? [asc(r.rating), desc(r.createdAt)] : [desc(r.createdAt)],
    limit: perPage,
    offset: (page - 1) * perPage,
    with: {
      user: { columns: { id: true, name: true, image: true } },
      product: {
        columns: { id: true, slug: true, title: true },
        with: { images: { columns: { url: true }, orderBy: (i, { asc }) => [asc(i.position)], limit: 1 } },
      },
    },
  });
  return { items, total, page, pageCount };
}

export async function getReviewFilterCounts(storeId: string, rating?: number) {
  const r = schema.reviews;
  const conds: SQL[] = [eq(r.storeId, storeId)];
  if (rating && rating >= 1 && rating <= 5) conds.push(eq(r.rating, rating));
  const [row] = await db
    .select({
      all: sql<number>`count(*)`,
      answered: sql<number>`coalesce(sum(case when ${r.vendorResponse} is not null then 1 else 0 end), 0)`,
    })
    .from(r)
    .where(and(...conds));
  const all = Number(row?.all ?? 0);
  const answered = Number(row?.answered ?? 0);
  return { all, answered, unanswered: all - answered };
}

export async function getPayoutsOverview(storeId: string) {
  const rows = await db.query.payouts.findMany({
    where: eq(schema.payouts.storeId, storeId),
    orderBy: [desc(schema.payouts.periodEnd)],
  });
  const now = Date.now();
  const scheduled = rows.find((p) => p.status === "scheduled") ?? null;
  const paid = rows.filter((p) => p.status === "paid");
  return {
    rows,
    next: scheduled ? { ...scheduled, payoutDate: new Date(scheduled.periodEnd.getTime() + 2 * DAY) } : null,
    inTransit: rows.filter((p) => p.status === "in_transit").reduce((s, p) => s + p.amount, 0),
    inTransitCount: rows.filter((p) => p.status === "in_transit").length,
    paid90: paid.filter((p) => p.paidAt && p.paidAt.getTime() >= now - 90 * DAY).reduce((s, p) => s + p.amount, 0),
    lifetime: paid.reduce((s, p) => s + p.amount, 0),
    paidCount: paid.length,
  };
}

export async function getShippingRates(storeId: string) {
  return db.query.shippingRates.findMany({
    where: eq(schema.shippingRates.storeId, storeId),
    orderBy: [asc(schema.shippingRates.zone), asc(schema.shippingRates.price)],
  });
}

export async function getStoreStaff(storeId: string) {
  return db.query.storeStaff.findMany({
    where: eq(schema.storeStaff.storeId, storeId),
    orderBy: [asc(schema.storeStaff.createdAt)],
  });
}

export async function getSupportTickets(storeId: string) {
  return db.query.supportTickets.findMany({
    where: eq(schema.supportTickets.storeId, storeId),
    orderBy: [desc(schema.supportTickets.updatedAt)],
  });
}
