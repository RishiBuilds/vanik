import "server-only";
import { cache } from "react";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const getMyFavoriteIds = cache(async (): Promise<Set<string>> => {
  const user = await getSessionUser();
  if (!user) return new Set();
  const rows = await db.select({ id: schema.favorites.productId }).from(schema.favorites).where(eq(schema.favorites.userId, user.id));
  return new Set(rows.map((r) => r.id));
});

export const getMyFollowedStoreIds = cache(async (): Promise<Set<string>> => {
  const user = await getSessionUser();
  if (!user) return new Set();
  const rows = await db.select({ id: schema.storeFollows.storeId }).from(schema.storeFollows).where(eq(schema.storeFollows.userId, user.id));
  return new Set(rows.map((r) => r.id));
});

export async function getAddresses(userId: string) {
  return db.query.addresses.findMany({
    where: eq(schema.addresses.userId, userId),
    orderBy: [desc(schema.addresses.isDefault), desc(schema.addresses.createdAt)],
  });
}

export async function getPaymentMethods(userId: string) {
  return db.query.paymentMethods.findMany({
    where: eq(schema.paymentMethods.userId, userId),
    orderBy: [desc(schema.paymentMethods.isDefault), desc(schema.paymentMethods.createdAt)],
  });
}

export async function getOrders(userId: string, opts: { limit?: number; status?: "active" | "delivered" | "cancelled" } = {}) {
  const orders = await db.query.orders.findMany({
    where: eq(schema.orders.userId, userId),
    orderBy: desc(schema.orders.createdAt),
    limit: opts.limit,
    with: {
      storeOrders: {
        with: {
          store: { columns: { name: true, slug: true, logo: true } },
          items: { columns: { id: true, title: true, image: true, quantity: true, productId: true, variantLabel: true } },
        },
      },
    },
  });
  return orders;
}

export async function getOrder(userId: string, orderId: string) {
  return db.query.orders.findFirst({
    where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
    with: {
      storeOrders: {
        with: {
          store: { columns: { id: true, name: true, slug: true, logo: true, supportEmail: true } },
          items: { with: { product: { columns: { slug: true } } } },
          events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
        },
      },
    },
  });
}

export async function getReviewedProductIds(userId: string, productIds: string[]) {
  if (!productIds.length) return new Set<string>();
  const rows = await db
    .select({ id: schema.reviews.productId })
    .from(schema.reviews)
    .where(and(eq(schema.reviews.userId, userId), inArray(schema.reviews.productId, productIds)));
  return new Set(rows.map((r) => r.id));
}
