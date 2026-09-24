"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/lib/actions/cart";

export async function toggleFavorite(productId: string): Promise<ActionResult<{ favorited: boolean }> | { ok: false; error: "auth" }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "auth" };
  const where = and(eq(schema.favorites.userId, user.id), eq(schema.favorites.productId, productId));
  const existing = await db.query.favorites.findFirst({ where });
  if (existing) await db.delete(schema.favorites).where(where);
  else await db.insert(schema.favorites).values({ userId: user.id, productId });
  revalidatePath("/account/wishlist");
  return { ok: true, data: { favorited: !existing } };
}

export async function toggleFollow(storeId: string): Promise<ActionResult<{ following: boolean }> | { ok: false; error: "auth" }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "auth" };
  const where = and(eq(schema.storeFollows.userId, user.id), eq(schema.storeFollows.storeId, storeId));
  const existing = await db.query.storeFollows.findFirst({ where });
  if (existing) {
    await db.delete(schema.storeFollows).where(where);
    await db.update(schema.stores).set({ followerCount: sql`max(0, ${schema.stores.followerCount} - 1)` }).where(eq(schema.stores.id, storeId));
  } else {
    await db.insert(schema.storeFollows).values({ userId: user.id, storeId });
    await db.update(schema.stores).set({ followerCount: sql`${schema.stores.followerCount} + 1` }).where(eq(schema.stores.id, storeId));
  }
  revalidatePath("/s/[slug]", "page");
  revalidatePath("/account/wishlist");
  return { ok: true, data: { following: !existing } };
}

export async function subscribeNewsletter(email: string): Promise<ActionResult> {
  const parsed = z.email().safeParse(email.trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  await db.insert(schema.newsletterSubscribers).values({ email: parsed.data }).onConflictDoNothing();
  return { ok: true, message: "You’re on the list. Watch your inbox for new-shop drops." };
}

export async function markReviewHelpful(reviewId: string): Promise<ActionResult> {
  await db
    .update(schema.reviews)
    .set({ helpfulCount: sql`${schema.reviews.helpfulCount} + 1` })
    .where(eq(schema.reviews.id, reviewId));
  return { ok: true };
}
