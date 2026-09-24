import "server-only";
import { and, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { FulfillmentStatus } from "@/lib/db/schema";

const { storeOrders: so, orders: o, user: u } = schema;

export const ORDER_TABS = {
  all: { label: "All", statuses: null },
  to_fulfil: { label: "To fulfil", statuses: ["placed", "confirmed"] },
  packed: { label: "Packed", statuses: ["packed"] },
  in_transit: { label: "In transit", statuses: ["shipped", "out_for_delivery"] },
  delivered: { label: "Delivered", statuses: ["delivered"] },
  cancelled: { label: "Cancelled", statuses: ["cancelled"] },
} as const satisfies Record<string, { label: string; statuses: FulfillmentStatus[] | null }>;
export type OrderTab = keyof typeof ORDER_TABS;

export async function listVendorOrders(storeId: string, opts: { tab: OrderTab; q?: string; page: number; perPage?: number }) {
  const perPage = opts.perPage ?? 20;
  const conds: SQL[] = [eq(so.storeId, storeId)];
  const statuses = ORDER_TABS[opts.tab].statuses;
  if (statuses) conds.push(inArray(so.status, [...statuses]));
  const q = opts.q?.trim();
  if (q) {
    const pat = `%${q.replace(/[%_]/g, "")}%`;
    conds.push(or(like(o.number, pat), like(u.name, pat), like(u.email, pat))!);
  }
  const where = and(...conds);

  const [rows, [{ total }], countRows] = await Promise.all([
    db
      .select({
        id: so.id,
        status: so.status,
        subtotal: so.subtotal,
        shippingCost: so.shippingCost,
        shippingMethod: so.shippingMethod,
        createdAt: so.createdAt,
        number: o.number,
        paymentLabel: sql<string>`json_extract(${o.payment}, '$.label')`,
        paymentStatus: o.paymentStatus,
        city: sql<string>`json_extract(${o.shippingAddress}, '$.city') || ', ' || json_extract(${o.shippingAddress}, '$.region')`,
        customerName: u.name,
        customerEmail: u.email,
        customerImage: u.image,
        items: sql<number>`(select coalesce(sum(quantity), 0) from order_items where order_items.store_order_id = ${so.id})`,
        preview: sql<string>`(select json_group_array(image) from (select image from order_items where order_items.store_order_id = ${so.id} limit 3))`,
      })
      .from(so)
      .innerJoin(o, eq(o.id, so.orderId))
      .innerJoin(u, eq(u.id, o.userId))
      .where(where)
      .orderBy(desc(so.createdAt))
      .limit(perPage)
      .offset((opts.page - 1) * perPage),
    db.select({ total: sql<number>`count(*)` }).from(so).innerJoin(o, eq(o.id, so.orderId)).innerJoin(u, eq(u.id, o.userId)).where(where),
    db.select({ status: so.status, n: sql<number>`count(*)` }).from(so).where(eq(so.storeId, storeId)).groupBy(so.status),
  ]);

  const byStatus = new Map(countRows.map((r) => [r.status, Number(r.n)]));
  const counts = Object.fromEntries(
    (Object.keys(ORDER_TABS) as OrderTab[]).map((t) => {
      const st = ORDER_TABS[t].statuses;
      return [t, st ? st.reduce((n, s) => n + (byStatus.get(s) ?? 0), 0) : [...byStatus.values()].reduce((a, b) => a + b, 0)];
    }),
  ) as Record<OrderTab, number>;

  return {
    rows: rows.map((r) => ({ ...r, items: Number(r.items), preview: (JSON.parse(r.preview || "[]") as (string | null)[]).filter(Boolean) as string[] })),
    total: Number(total),
    pageCount: Math.max(1, Math.ceil(Number(total) / perPage)),
    counts,
  };
}

export async function getVendorOrder(storeId: string, storeOrderId: string) {
  const row = await db.query.storeOrders.findFirst({
    where: and(eq(so.id, storeOrderId), eq(so.storeId, storeId)),
    with: {
      items: { with: { product: { columns: { id: true, slug: true } } } },
      events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
      order: { with: { user: { columns: { id: true, name: true, email: true, image: true, createdAt: true } } } },
    },
  });
  if (!row) return null;
  const [history] = await db
    .select({ orders: sql<number>`count(*)`, spent: sql<number>`coalesce(sum(${so.subtotal}), 0)` })
    .from(so)
    .innerJoin(o, eq(o.id, so.orderId))
    .where(and(eq(so.storeId, storeId), eq(o.userId, row.order.user.id)));
  return { ...row, customerHistory: { orders: Number(history?.orders ?? 0), spent: Number(history?.spent ?? 0) } };
}
