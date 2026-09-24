"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { CART_COOKIE } from "@/lib/queries/cart";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

async function getOrCreateCartId(): Promise<string> {
  const user = await getSessionUser();
  if (user) {
    const existing = await db.query.carts.findFirst({ where: eq(schema.carts.userId, user.id), columns: { id: true } });
    if (existing) return existing.id;
    const [created] = await db.insert(schema.carts).values({ userId: user.id }).returning({ id: schema.carts.id });
    return created!.id;
  }
  const jar = await cookies();
  const cookieId = jar.get(CART_COOKIE)?.value;
  if (cookieId) {
    const existing = await db.query.carts.findFirst({
      where: and(eq(schema.carts.id, cookieId), isNull(schema.carts.userId)),
      columns: { id: true },
    });
    if (existing) return existing.id;
  }
  const [created] = await db.insert(schema.carts).values({}).returning({ id: schema.carts.id });
  jar.set(CART_COOKIE, created!.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  return created!.id;
}

async function ownedItem(itemId: string) {
  const cartId = await getOrCreateCartId();
  const item = await db.query.cartItems.findFirst({
    where: and(eq(schema.cartItems.id, itemId), eq(schema.cartItems.cartId, cartId)),
  });
  return { cartId, item };
}

const addSchema = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(99) });

export async function addToCart(input: { variantId: string; quantity: number }): Promise<ActionResult<{ count: number }>> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid item." };
  const variant = await db.query.productVariants.findFirst({
    where: eq(schema.productVariants.id, parsed.data.variantId),
    with: { product: { columns: { id: true, status: true, title: true } } },
  });
  if (!variant || variant.product.status !== "active") return { ok: false, error: "This item is no longer available." };
  if (variant.stock <= 0) return { ok: false, error: "Sorry — this option just sold out." };

  const cartId = await getOrCreateCartId();
  const existing = await db.query.cartItems.findFirst({
    where: and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.variantId, variant.id)),
  });
  const desired = (existing && !existing.savedForLater ? existing.quantity : 0) + parsed.data.quantity;
  const qty = Math.min(desired, variant.stock);
  if (existing) {
    await db.update(schema.cartItems).set({ quantity: qty, savedForLater: false }).where(eq(schema.cartItems.id, existing.id));
  } else {
    await db.insert(schema.cartItems).values({ cartId, productId: variant.product.id, variantId: variant.id, quantity: qty });
  }
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: qty < desired ? `Only ${variant.stock} available — we added the maximum.` : `${variant.product.title} added to cart`,
  };
}

export async function updateCartQuantity(itemId: string, quantity: number): Promise<ActionResult> {
  const { item } = await ownedItem(itemId);
  if (!item) return { ok: false, error: "Item not found." };
  const variant = await db.query.productVariants.findFirst({ where: eq(schema.productVariants.id, item.variantId) });
  const qty = Math.max(1, Math.min(Math.round(quantity), variant?.stock ?? 1, 99));
  await db.update(schema.cartItems).set({ quantity: qty }).where(eq(schema.cartItems.id, itemId));
  revalidatePath("/", "layout");
  return qty < quantity ? { ok: true, message: `Only ${qty} in stock.` } : { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  const { item } = await ownedItem(itemId);
  if (!item) return { ok: false, error: "Item not found." };
  await db.delete(schema.cartItems).where(eq(schema.cartItems.id, itemId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleSaveForLater(itemId: string, saved: boolean): Promise<ActionResult> {
  const { item } = await ownedItem(itemId);
  if (!item) return { ok: false, error: "Item not found." };
  await db.update(schema.cartItems).set({ savedForLater: saved }).where(eq(schema.cartItems.id, itemId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function applyPromoCode(code: string): Promise<ActionResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter a promo code." };
  const promo = await db.query.promoCodes.findFirst({
    where: and(eq(schema.promoCodes.code, normalized), eq(schema.promoCodes.active, true)),
  });
  if (!promo) return { ok: false, error: "That code isn’t valid or has expired." };
  const cartId = await getOrCreateCartId();
  await db.update(schema.carts).set({ promoCode: promo.code }).where(eq(schema.carts.id, cartId));
  revalidatePath("/", "layout");
  return { ok: true, message: `${promo.code} applied — ${promo.description.toLowerCase()}.` };
}

export async function removePromoCode(): Promise<ActionResult> {
  const cartId = await getOrCreateCartId();
  await db.update(schema.carts).set({ promoCode: null }).where(eq(schema.carts.id, cartId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function claimGuestCart(): Promise<void> {
  const user = await getSessionUser();
  const jar = await cookies();
  const guestId = jar.get(CART_COOKIE)?.value;
  if (!user || !guestId) return;
  const guest = await db.query.carts.findFirst({
    where: and(eq(schema.carts.id, guestId), isNull(schema.carts.userId)),
    with: { items: true },
  });
  jar.delete(CART_COOKIE);
  if (!guest) return;
  const mine = await db.query.carts.findFirst({ where: eq(schema.carts.userId, user.id), with: { items: true } });
  if (!mine) {
    await db.update(schema.carts).set({ userId: user.id }).where(eq(schema.carts.id, guest.id));
  } else {
    for (const it of guest.items) {
      const dup = mine.items.find((m) => m.variantId === it.variantId);
      if (dup) {
        await db.update(schema.cartItems).set({ quantity: Math.min(99, dup.quantity + it.quantity), savedForLater: false }).where(eq(schema.cartItems.id, dup.id));
      } else {
        await db.insert(schema.cartItems).values({ cartId: mine.id, productId: it.productId, variantId: it.variantId, quantity: it.quantity, savedForLater: it.savedForLater });
      }
    }
    if (guest.promoCode && !mine.promoCode) await db.update(schema.carts).set({ promoCode: guest.promoCode }).where(eq(schema.carts.id, mine.id));
    await db.delete(schema.carts).where(eq(schema.carts.id, guest.id));
  }
  revalidatePath("/", "layout");
}
