"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/services/notifications";
import type { ActionResult } from "@/lib/actions/cart";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3, "Add a short title").max(80),
  body: z.string().trim().min(20, "Tell other shoppers a little more (20+ characters)").max(2000),
});

async function refreshAggregates(productId: string, storeId: string) {
  await db.run(sql`UPDATE products SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = ${productId}), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ${productId}) WHERE id = ${productId}`);
  await db.run(sql`UPDATE stores SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE store_id = ${storeId}), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE store_id = ${storeId}) WHERE id = ${storeId}`);
}

export async function submitReview(input: z.input<typeof reviewSchema>): Promise<ActionResult | { ok: false; error: string; fieldErrors: Record<string, string[]> }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { productId, rating, title, body } = parsed.data;

  const product = await db.query.products.findFirst({ where: eq(schema.products.id, productId), with: { store: true } });
  if (!product) return { ok: false, error: "Product not found." };

  const purchase = await db
    .select({ variantLabel: schema.orderItems.variantLabel })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(and(eq(schema.orders.userId, user.id), eq(schema.orderItems.productId, productId)))
    .limit(1);
  const existing = await db.query.reviews.findFirst({
    where: and(eq(schema.reviews.userId, user.id), eq(schema.reviews.productId, productId)),
  });

  if (existing) {
    await db.update(schema.reviews).set({ rating, title, body }).where(eq(schema.reviews.id, existing.id));
  } else {
    await db.insert(schema.reviews).values({
      productId,
      storeId: product.storeId,
      userId: user.id,
      rating,
      title,
      body,
      verifiedPurchase: purchase.length > 0,
      variantLabel: purchase[0]?.variantLabel ?? null,
    });
    await notify({
      userId: product.store.ownerId,
      type: "review",
      title: `New ${rating}-star review`,
      body: `“${title}” on ${product.title}.`,
      href: "/vendor/reviews",
    });
  }
  await refreshAggregates(productId, product.storeId);
  revalidatePath(`/p/${product.slug}`);
  revalidatePath("/account/reviews");
  return { ok: true, message: existing ? "Your review was updated." : "Thanks — your review is live." };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const review = await db.query.reviews.findFirst({
    where: and(eq(schema.reviews.id, reviewId), eq(schema.reviews.userId, user.id)),
    with: { product: { columns: { slug: true } } },
  });
  if (!review) return { ok: false, error: "Review not found." };
  await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));
  await refreshAggregates(review.productId, review.storeId);
  revalidatePath(`/p/${review.product.slug}`);
  revalidatePath("/account/reviews");
  return { ok: true, message: "Review deleted." };
}
