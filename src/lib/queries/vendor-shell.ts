import "server-only";
import { cache } from "react";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const getVendorBadgeCounts = cache(async (storeId: string) => {
  const [[orders], [stock], [reviews]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.storeOrders)
      .where(and(eq(schema.storeOrders.storeId, storeId), inArray(schema.storeOrders.status, ["placed", "confirmed"]))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.products.storeId, storeId),
          ne(schema.products.status, "archived"),
          sql`${schema.productVariants.stock} <= ${schema.productVariants.lowStockThreshold}`,
        ),
      ),
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.reviews)
      .where(and(eq(schema.reviews.storeId, storeId), isNull(schema.reviews.vendorResponse))),
  ]);
  return { orders: Number(orders?.n ?? 0), lowStock: Number(stock?.n ?? 0), reviews: Number(reviews?.n ?? 0) };
});
