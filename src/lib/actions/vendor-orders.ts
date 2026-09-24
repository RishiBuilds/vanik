"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import type { FulfillmentStatus } from "@/lib/db/schema";
import { getVendorContext } from "@/lib/session";
import { notify } from "@/lib/services/notifications";
import { paymentGateway } from "@/lib/services/payments";
import { CARRIER_HUBS, generateTrackingNumber, nextStatuses, STATUS_META } from "@/lib/services/shipping";

export type VendorActionResult = { ok: true; message?: string } | { ok: false; error: string };

const input = z.object({
  storeOrderId: z.string(),
  next: z.enum(["confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]),
  carrier: z.string().trim().max(40).optional(),
  trackingNumber: z.string().trim().max(40).optional(),
  note: z.string().trim().max(300).optional(),
});

const CUSTOMER_COPY: Partial<Record<FulfillmentStatus, (store: string, number: string) => { title: string; body: string }>> = {
  confirmed: (s, n) => ({ title: "Order confirmed by the shop", body: `${s} confirmed their part of ${n} and is getting it ready.` }),
  shipped: (s, n) => ({ title: "Your order has shipped", body: `${s} shipped their part of ${n}. Track it from your orders page.` }),
  out_for_delivery: (s, n) => ({ title: "Out for delivery", body: `Your ${s} package from ${n} is out for delivery today.` }),
  delivered: (s, n) => ({ title: "Delivered", body: `Your ${s} package from ${n} was delivered. Enjoy — and let them know what you think!` }),
  cancelled: (s, n) => ({ title: "Part of your order was cancelled", body: `${s} cancelled their items in ${n}. A refund is on its way to your original payment method.` }),
};

async function apply(storeId: string, storeName: string, storeLocation: string, raw: z.input<typeof input>): Promise<VendorActionResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid update." };
  const { storeOrderId, next, note } = parsed.data;
  const so = await db.query.storeOrders.findFirst({
    where: and(eq(schema.storeOrders.id, storeOrderId), eq(schema.storeOrders.storeId, storeId)),
    with: { order: true, items: true },
  });
  if (!so) return { ok: false, error: "Order not found." };
  if (!nextStatuses(so.status).includes(next)) {
    return { ok: false, error: `Can’t move an order from “${STATUS_META[so.status].label}” to “${STATUS_META[next].label}”.` };
  }

  const addr = so.order.shippingAddress;
  const carrier = next === "shipped" ? parsed.data.carrier || so.carrier || "Delhivery" : so.carrier;
  const tracking = next === "shipped" ? parsed.data.trackingNumber || generateTrackingNumber(carrier ?? "Delhivery") : so.trackingNumber;
  const location =
    next === "shipped" ? storeLocation || null : next === "out_for_delivery" ? CARRIER_HUBS[Math.floor(Math.random() * CARRIER_HUBS.length)]! : next === "delivered" ? `${addr.city}, ${addr.region}` : null;

  let refundAll = false;
  await db.transaction(async (tx) => {
    await tx
      .update(schema.storeOrders)
      .set({ status: next, carrier, trackingNumber: tracking })
      .where(eq(schema.storeOrders.id, so.id));
    await tx.insert(schema.orderEvents).values({
      storeOrderId: so.id,
      status: next,
      location,
      note: next === "cancelled" ? note || "Cancelled by the shop. A refund has been issued to the original payment method." : note || null,
    });
    if (next === "cancelled") {
      for (const it of so.items) {
        if (!it.variantId) continue;
        const v = await tx.query.productVariants.findFirst({ where: eq(schema.productVariants.id, it.variantId) });
        if (v) await tx.update(schema.productVariants).set({ stock: v.stock + it.quantity }).where(eq(schema.productVariants.id, v.id));
      }
      const siblings = await tx.query.storeOrders.findMany({ where: eq(schema.storeOrders.orderId, so.orderId) });
      refundAll = siblings.every((s) => s.id === so.id || s.status === "cancelled");
      if (refundAll) await tx.update(schema.orders).set({ paymentStatus: "refunded" }).where(eq(schema.orders.id, so.orderId));
    }
    if (next === "delivered" && so.order.payment.type === "cod") {
      const siblings = await tx.query.storeOrders.findMany({ where: eq(schema.storeOrders.orderId, so.orderId) });
      if (siblings.every((s) => s.id === so.id || s.status === "delivered" || s.status === "cancelled")) {
        await tx.update(schema.orders).set({ paymentStatus: "paid" }).where(eq(schema.orders.id, so.orderId));
      }
    }
  });
  if (refundAll && so.order.gatewayChargeId) await paymentGateway.refund(so.order.gatewayChargeId);

  const copy = CUSTOMER_COPY[next]?.(storeName, so.order.number);
  if (copy) {
    await notify({
      userId: so.order.userId,
      type: next === "confirmed" || next === "cancelled" ? "order" : "shipping",
      title: copy.title,
      body: copy.body,
      href: `/account/orders/${so.orderId}`,
    });
  }
  return { ok: true, message: `${so.order.number} marked ${STATUS_META[next].label.toLowerCase()}.` };
}

export async function updateFulfillment(raw: z.input<typeof input>): Promise<VendorActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return { ok: false, error: "Not authorised." };
  const res = await apply(ctx.store.id, ctx.store.name, ctx.store.location, raw);
  revalidatePath("/vendor", "layout");
  revalidatePath("/account", "layout");
  return res;
}

export async function bulkAdvance(ids: string[], next: "confirmed" | "packed" | "shipped"): Promise<VendorActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return { ok: false, error: "Not authorised." };
  const rows = await db.query.storeOrders.findMany({
    where: and(inArray(schema.storeOrders.id, ids.slice(0, 100)), eq(schema.storeOrders.storeId, ctx.store.id)),
    columns: { id: true, status: true },
  });
  let done = 0;
  for (const r of rows) {
    if (!nextStatuses(r.status).includes(next)) continue;
    const res = await apply(ctx.store.id, ctx.store.name, ctx.store.location, { storeOrderId: r.id, next });
    if (res.ok) done++;
  }
  revalidatePath("/vendor", "layout");
  revalidatePath("/account", "layout");
  const skipped = rows.length - done;
  if (!done) return { ok: false, error: `None of the selected orders can be marked ${STATUS_META[next].label.toLowerCase()}.` };
  return { ok: true, message: `${done} order${done === 1 ? "" : "s"} marked ${STATUS_META[next].label.toLowerCase()}${skipped ? ` · ${skipped} skipped` : ""}.` };
}
