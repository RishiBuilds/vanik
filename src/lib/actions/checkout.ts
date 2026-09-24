"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import type { AddressSnapshot, PaymentSnapshot } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/session";
import { getCart } from "@/lib/queries/cart";
import { COD_LIMIT, computeTotals } from "@/lib/services/pricing";
import { formatMoney } from "@/lib/utils";
import { paymentGateway } from "@/lib/services/payments";
import { NETBANKING_BANKS, WALLETS } from "@/lib/services/wallets";
import { estimateDelivery } from "@/lib/services/shipping";
import { notify } from "@/lib/services/notifications";
import { addressSchema, cardSchema, upiSchema } from "@/lib/validation";

const checkoutSchema = z.object({
  address: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("saved"), id: z.string() }),
    z.object({ kind: z.literal("new"), value: addressSchema, save: z.boolean() }),
  ]),
  shipping: z.record(z.string(), z.string()),
  payment: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("saved"), id: z.string() }),
    z.object({ kind: z.literal("card"), value: cardSchema, save: z.boolean() }),
    z.object({ kind: z.literal("wallet"), provider: z.enum(["vanikpay", "upi", "netbanking"]), handle: z.string().trim().max(120).optional() }),
    z.object({ kind: z.literal("cod") }),
  ]),

  expectedTotal: z.number().int(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; step?: "address" | "shipping" | "payment" | "review"; fieldErrors?: Record<string, string[] | undefined> };


class StockError extends Error {}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Your session expired — please sign in again." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { ok: false, error: "Please check your details.", fieldErrors: flat.fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  const cart = await getCart();
  if (!cart.id || cart.groups.length === 0) return { ok: false, error: "Your cart is empty.", step: "review" };
  if (cart.hasUnavailable) return { ok: false, error: "Some items in your cart are no longer available. Please review your cart.", step: "review" };


  let address: AddressSnapshot;
  if (data.address.kind === "saved") {
    const saved = await db.query.addresses.findFirst({
      where: and(eq(schema.addresses.id, data.address.id), eq(schema.addresses.userId, user.id)),
    });
    if (!saved) return { ok: false, error: "Choose a shipping address.", step: "address" };
    address = { fullName: saved.fullName, line1: saved.line1, line2: saved.line2, city: saved.city, region: saved.region, postalCode: saved.postalCode, country: saved.country, phone: saved.phone };
  } else {
    const a = data.address.value;
    address = { fullName: a.fullName, line1: a.line1, line2: a.line2 || null, city: a.city, region: a.region, postalCode: a.postalCode, country: a.country, phone: a.phone || null };
  }


  const shipments = cart.groups.map((g) => {
    const rate = g.rates.find((r) => r.rateId === data.shipping[g.store.id]) ?? g.rates[0]!;
    return { group: g, rate };
  });
  const shippingTotal = shipments.reduce((s, x) => s + x.rate.price, 0);
  const totals = computeTotals({ subtotal: cart.totals.subtotal, shipping: shippingTotal, promo: cart.promo });
  if (totals.total !== data.expectedTotal) {
    return { ok: false, error: "Prices or shipping changed while you were checking out. Please review your order total.", step: "review" };
  }


  let payment: PaymentSnapshot;
  let chargeMethod: Parameters<typeof paymentGateway.charge>[0]["method"];
  let cardToSave: { brand: string; last4: string; expMonth: number; expYear: number; holderName: string; token: string } | null = null;

  if (data.payment.kind === "saved") {
    const pm = await db.query.paymentMethods.findFirst({
      where: and(eq(schema.paymentMethods.id, data.payment.id), eq(schema.paymentMethods.userId, user.id)),
    });
    if (!pm) return { ok: false, error: "Choose a payment method.", step: "payment" };
    payment =
      pm.type === "card"
        ? { type: "card", brand: pm.brand, last4: pm.last4, label: `${cap(pm.brand)} •••• ${pm.last4}` }
        : { type: "wallet", brand: pm.brand, label: `${WALLETS.find((w) => w.id === pm.brand)?.label ?? pm.brand}${pm.email ? ` · ${pm.email}` : ""}` };
    chargeMethod = pm.type === "card" ? { kind: "card_token", token: pm.gatewayToken } : { kind: "wallet", provider: pm.brand };
  } else if (data.payment.kind === "card") {
    const c = data.payment.value;
    const [mm, yy] = c.expiry.split("/").map((x) => Number(x.trim()));
    const tok = await paymentGateway.tokenizeCard({ number: c.number, expMonth: mm!, expYear: 2000 + yy!, cvc: c.cvc, holderName: c.holderName });
    if (!tok.ok) return { ok: false, error: tok.message, step: "payment", fieldErrors: { number: [tok.message] } };
    payment = { type: "card", brand: tok.card.brand, last4: tok.card.last4, label: `${cap(tok.card.brand)} •••• ${tok.card.last4}` };
    chargeMethod = { kind: "card_token", token: tok.card.token };
    if (data.payment.save) cardToSave = { ...tok.card, holderName: c.holderName };
  } else if (data.payment.kind === "wallet") {
    const { provider, handle } = data.payment;
    const w = WALLETS.find((x) => x.id === provider)!;
    if (provider === "upi" && !upiSchema.safeParse(handle ?? "").success) {
      return { ok: false, error: "Enter a valid UPI ID, e.g. name@okhdfcbank.", step: "payment", fieldErrors: { upi: ["Enter a valid UPI ID"] } };
    }
    if (provider === "netbanking" && !NETBANKING_BANKS.includes((handle ?? "") as (typeof NETBANKING_BANKS)[number])) {
      return { ok: false, error: "Choose your bank.", step: "payment" };
    }
    payment = { type: "wallet", brand: w.id, label: handle ? `${w.label} · ${handle}` : w.label };
    chargeMethod = { kind: "wallet", provider: w.id };
  } else {
    if (totals.total > COD_LIMIT) return { ok: false, error: `Cash on delivery is available for orders up to ${formatMoney(COD_LIMIT)}.`, step: "payment" };
    payment = { type: "cod", brand: "cod", label: "Cash on delivery" };
    chargeMethod = { kind: "cod" };
  }

  const charge = await paymentGateway.charge({
    amount: totals.total,
    currency: "inr",
    method: chargeMethod,
    description: `Vanik order for ${user.email}`,
    idempotencyKey: `${cart.id}:${totals.total}`,
  });
  if (!charge.ok) return { ok: false, error: charge.message, step: "payment" };


  const orderId = crypto.randomUUID();
  const now = new Date();
  let lowStock: { sku: string; stock: number; storeId: string }[] = [];
  let orderNumber = "";
  try {
    await db.transaction(async (tx) => {
      const [{ maxNo }] = await tx
        .select({ maxNo: sql<number>`coalesce(max(cast(substr(${schema.orders.number}, 5) as integer)), 104200)` })
        .from(schema.orders);
      orderNumber = `VNK-${Number(maxNo) + 1}`;

      await tx.insert(schema.orders).values({
        id: orderId,
        number: orderNumber,
        userId: user.id,
        email: user.email,
        subtotal: totals.subtotal,
        shippingTotal: totals.shipping,
        taxTotal: totals.tax,
        discountTotal: totals.discount,
        total: totals.total,
        promoCode: cart.promo?.code ?? null,
        shippingAddress: address,
        payment,
        paymentStatus: charge.status === "pending" ? "pending" : "paid",
        gatewayChargeId: charge.chargeId,
        createdAt: now,
      });

      for (const { group, rate } of shipments) {
        const soId = crypto.randomUUID();
        await tx.insert(schema.storeOrders).values({
          id: soId,
          orderId,
          storeId: group.store.id,
          status: "placed",
          subtotal: group.subtotal,
          shippingCost: totals.shippingDiscount > 0 ? 0 : rate.price,
          shippingMethod: rate.name,
          estimatedDelivery: estimateDelivery(now, rate.maxDays + 1),
          createdAt: now,
        });
        await tx.insert(schema.orderEvents).values({ storeOrderId: soId, status: "placed", createdAt: now });
        for (const l of group.lines) {
          await tx.insert(schema.orderItems).values({
            orderId,
            storeOrderId: soId,
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            variantLabel: l.variantLabel,
            sku: l.sku,
            image: l.image,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
          });
          const updated = await tx
            .update(schema.productVariants)
            .set({ stock: sql`${schema.productVariants.stock} - ${l.quantity}` })
            .where(and(eq(schema.productVariants.id, l.variantId), gte(schema.productVariants.stock, l.quantity)))
            .returning({ stock: schema.productVariants.stock, sku: schema.productVariants.sku, threshold: schema.productVariants.lowStockThreshold });
          if (!updated[0]) throw new StockError(l.title);
          if (updated[0].stock <= updated[0].threshold) lowStock.push({ sku: updated[0].sku, stock: updated[0].stock, storeId: group.store.id });
          await tx
            .update(schema.products)
            .set({ salesCount: sql`${schema.products.salesCount} + ${l.quantity}` })
            .where(eq(schema.products.id, l.productId));
        }
        await tx.update(schema.stores).set({ salesCount: sql`${schema.stores.salesCount} + 1` }).where(eq(schema.stores.id, group.store.id));
      }

      await tx.delete(schema.cartItems).where(and(eq(schema.cartItems.cartId, cart.id!), eq(schema.cartItems.savedForLater, false)));
      await tx.update(schema.carts).set({ promoCode: null }).where(eq(schema.carts.id, cart.id!));

      if (data.address.kind === "new" && data.address.save) {
        const a = data.address.value;
        const hasDefault = await tx.query.addresses.findFirst({ where: and(eq(schema.addresses.userId, user.id), eq(schema.addresses.isDefault, true)) });
        await tx.insert(schema.addresses).values({ userId: user.id, ...a, line2: a.line2 || null, phone: a.phone || null, isDefault: !hasDefault });
      }
      if (cardToSave) {
        const hasDefault = await tx.query.paymentMethods.findFirst({ where: and(eq(schema.paymentMethods.userId, user.id), eq(schema.paymentMethods.isDefault, true)) });
        await tx.insert(schema.paymentMethods).values({
          userId: user.id,
          type: "card",
          brand: cardToSave.brand,
          last4: cardToSave.last4,
          expMonth: cardToSave.expMonth,
          expYear: cardToSave.expYear,
          holderName: cardToSave.holderName,
          gatewayToken: cardToSave.token,
          isDefault: !hasDefault,
        });
      }
    });
  } catch (e) {
    lowStock = [];
    await paymentGateway.refund(charge.chargeId);
    if (e instanceof StockError) return { ok: false, error: `“${e.message}” just sold out. Your payment was refunded — please update your cart.`, step: "review" };
    throw e;
  }


  await notify({
    userId: user.id,
    type: "order",
    title: "Order confirmed",
    body: `Thanks! Order ${orderNumber} is confirmed. We’ll let you know when it ships.`,
    href: `/account/orders/${orderId}`,
  });
  const storeRows = await db.query.stores.findMany({
    where: inArray(schema.stores.id, shipments.map((s) => s.group.store.id)),
    columns: { id: true, ownerId: true },
  });
  const storeOrders = await db.query.storeOrders.findMany({ where: eq(schema.storeOrders.orderId, orderId), columns: { id: true, storeId: true } });
  for (const s of storeRows) {
    const so = storeOrders.find((x) => x.storeId === s.id)!;
    const g = shipments.find((x) => x.group.store.id === s.id)!.group;
    await notify({
      userId: s.ownerId,
      type: "order",
      title: "New order received",
      body: `${orderNumber} · ${g.lines.reduce((n, l) => n + l.quantity, 0)} item(s) · ready to confirm.`,
      href: `/vendor/orders/${so.id}`,
    });
    for (const ls of lowStock.filter((x) => x.storeId === s.id)) {
      await notify({
        userId: s.ownerId,
        type: "stock",
        title: ls.stock === 0 ? "Sold out" : "Low stock",
        body: ls.stock === 0 ? `${ls.sku} just sold out.` : `${ls.sku} has only ${ls.stock} left.`,
        href: "/vendor/inventory?filter=low",
      });
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, orderId };
}

function cap(s: string) {
  return s === "mastercard" ? "Mastercard" : s === "amex" ? "Amex" : s === "rupay" ? "RuPay" : s.charAt(0).toUpperCase() + s.slice(1);
}
