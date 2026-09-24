import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { computeTotals, type Promo } from "@/lib/services/pricing";
import { FALLBACK_RATE, quoteRates, type RateQuote } from "@/lib/services/shipping";

export const CART_COOKIE = "vanik_cart";

export const getCurrentCartId = cache(async (): Promise<string | null> => {
  const user = await getSessionUser();
  if (user) {
    const cart = await db.query.carts.findFirst({ where: eq(schema.carts.userId, user.id), columns: { id: true } });
    return cart?.id ?? null;
  }
  const cookieId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cookieId) return null;
  const cart = await db.query.carts.findFirst({
    where: and(eq(schema.carts.id, cookieId), isNull(schema.carts.userId)),
    columns: { id: true },
  });
  return cart?.id ?? null;
});

export const getCartCount = cache(async () => {
  const cartId = await getCurrentCartId();
  if (!cartId) return 0;
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${schema.cartItems.quantity}), 0)` })
    .from(schema.cartItems)
    .where(and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.savedForLater, false)));
  return Number(row?.n ?? 0);
});

export type CartLine = {
  id: string;
  quantity: number;
  savedForLater: boolean;
  productId: string;
  productSlug: string;
  title: string;
  image: string | null;
  variantId: string;
  variantLabel: string | null;
  sku: string;
  unitPrice: number;
  compareAtPrice: number | null;
  stock: number;
  available: boolean;
  store: { id: string; name: string; slug: string };
};

export type CartGroup = {
  store: CartLine["store"];
  lines: CartLine[];
  subtotal: number;
  rates: RateQuote[];
  freeShippingThreshold: number | null;
};

export type CartView = Awaited<ReturnType<typeof getCart>>;

export const getCart = cache(async () => {
  const cartId = await getCurrentCartId();
  const empty = {
    id: cartId,
    groups: [] as CartGroup[],
    saved: [] as CartLine[],
    count: 0,
    promo: null as Promo | null,
    totals: computeTotals({ subtotal: 0, shipping: 0 }),
    hasUnavailable: false,
  };
  if (!cartId) return empty;

  const cart = await db.query.carts.findFirst({ where: eq(schema.carts.id, cartId) });
  const rows = await db
    .select({
      id: schema.cartItems.id,
      quantity: schema.cartItems.quantity,
      savedForLater: schema.cartItems.savedForLater,
      productId: schema.products.id,
      productSlug: schema.products.slug,
      productStatus: schema.products.status,
      title: schema.products.title,
      image: sql<string | null>`(select url from product_images pi where pi.product_id = ${schema.products.id} order by pi.position limit 1)`,
      variantId: schema.productVariants.id,
      attributes: schema.productVariants.attributes,
      sku: schema.productVariants.sku,
      unitPrice: schema.productVariants.price,
      compareAtPrice: schema.productVariants.compareAtPrice,
      stock: schema.productVariants.stock,
      storeId: schema.stores.id,
      storeName: schema.stores.name,
      storeSlug: schema.stores.slug,
    })
    .from(schema.cartItems)
    .innerJoin(schema.products, eq(schema.products.id, schema.cartItems.productId))
    .innerJoin(schema.productVariants, eq(schema.productVariants.id, schema.cartItems.variantId))
    .innerJoin(schema.stores, eq(schema.stores.id, schema.products.storeId))
    .where(eq(schema.cartItems.cartId, cartId))
    .orderBy(asc(schema.cartItems.createdAt));

  const lines: CartLine[] = rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    savedForLater: r.savedForLater,
    productId: r.productId,
    productSlug: r.productSlug,
    title: r.title,
    image: r.image,
    variantId: r.variantId,
    variantLabel: Object.values(r.attributes ?? {}).join(" / ") || null,
    sku: r.sku,
    unitPrice: r.unitPrice,
    compareAtPrice: r.compareAtPrice,
    stock: r.stock,
    available: r.productStatus === "active" && r.stock >= r.quantity,
    store: { id: r.storeId, name: r.storeName, slug: r.storeSlug },
  }));

  const active = lines.filter((l) => !l.savedForLater);
  const storeIds = [...new Set(active.map((l) => l.store.id))];
  const rates = storeIds.length
    ? await db.select().from(schema.shippingRates).where(inArray(schema.shippingRates.storeId, storeIds))
    : [];

  const groups: CartGroup[] = storeIds.map((storeId) => {
    const groupLines = active.filter((l) => l.store.id === storeId);
    const subtotal = groupLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const storeRates = rates.filter((r) => r.storeId === storeId && r.zone === "Domestic");
    const quotes = quoteRates(storeRates, subtotal);
    return {
      store: groupLines[0]!.store,
      lines: groupLines,
      subtotal,
      rates: quotes.length ? quotes : [FALLBACK_RATE],
      freeShippingThreshold: storeRates.find((r) => r.freeOver != null)?.freeOver ?? null,
    };
  });

  const promoRow = cart?.promoCode
    ? await db.query.promoCodes.findFirst({ where: and(eq(schema.promoCodes.code, cart.promoCode), eq(schema.promoCodes.active, true)) })
    : null;
  const promo: Promo | null = promoRow
    ? { code: promoRow.code, description: promoRow.description, type: promoRow.type, value: promoRow.value, minSubtotal: promoRow.minSubtotal }
    : null;

  const subtotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const shipping = groups.reduce((sum, g) => sum + g.rates[0]!.price, 0);

  return {
    id: cartId,
    groups,
    saved: lines.filter((l) => l.savedForLater),
    count: active.reduce((sum, l) => sum + l.quantity, 0),
    promo,
    totals: computeTotals({ subtotal, shipping, promo }),
    hasUnavailable: active.some((l) => !l.available),
  };
});
