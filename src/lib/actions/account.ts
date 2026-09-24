"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { defaultNotificationPrefs, type NotificationPrefsMap } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/session";
import { paymentGateway } from "@/lib/services/payments";
import { notify } from "@/lib/services/notifications";
import { addressSchema, cardSchema, upiSchema } from "@/lib/validation";

export type FormResult = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

async function me() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Enter a 10-digit phone number"),
  image: z.union([z.literal(""), z.url("Enter a valid image URL")]),
});

export async function updateProfile(input: z.input<typeof profileSchema>): Promise<FormResult> {
  const user = await me();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  await db
    .update(schema.user)
    .set({ name: parsed.data.name, phone: parsed.data.phone || null, image: parsed.data.image || null })
    .where(eq(schema.user.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function saveAddress(input: { id?: string; value: z.input<typeof addressSchema>; makeDefault?: boolean }): Promise<FormResult> {
  const user = await me();
  const parsed = addressSchema.safeParse(input.value);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const v = { ...parsed.data, line2: parsed.data.line2 || null, phone: parsed.data.phone || null };
  const existingCount = (await db.query.addresses.findMany({ where: eq(schema.addresses.userId, user.id), columns: { id: true } })).length;
  const makeDefault = input.makeDefault || existingCount === 0;

  let id = input.id;
  if (id) {
    const owned = await db.query.addresses.findFirst({ where: and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)) });
    if (!owned) return { ok: false, error: "Address not found." };
    await db.update(schema.addresses).set(v).where(eq(schema.addresses.id, id));
  } else {
    const [row] = await db.insert(schema.addresses).values({ userId: user.id, ...v }).returning({ id: schema.addresses.id });
    id = row!.id;
  }
  if (makeDefault) await setDefault("addresses", user.id, id);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, message: input.id ? "Address updated." : "Address added." };
}

async function setDefault(kind: "addresses" | "paymentMethods", userId: string, id: string) {
  const table = kind === "addresses" ? schema.addresses : schema.paymentMethods;
  await db.update(table).set({ isDefault: false }).where(and(eq(table.userId, userId), ne(table.id, id)));
  await db.update(table).set({ isDefault: true }).where(and(eq(table.userId, userId), eq(table.id, id)));
}

export async function setDefaultAddress(id: string): Promise<FormResult> {
  const user = await me();
  await setDefault("addresses", user.id, id);
  revalidatePath("/account/addresses");
  return { ok: true, message: "Default address updated." };
}

export async function deleteAddress(id: string): Promise<FormResult> {
  const user = await me();
  const row = await db.query.addresses.findFirst({ where: and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)) });
  if (!row) return { ok: false, error: "Address not found." };
  await db.delete(schema.addresses).where(eq(schema.addresses.id, id));
  if (row.isDefault) {
    const next = await db.query.addresses.findFirst({ where: eq(schema.addresses.userId, user.id) });
    if (next) await setDefault("addresses", user.id, next.id);
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address deleted." };
}

export async function addCard(input: z.input<typeof cardSchema> & { makeDefault?: boolean }): Promise<FormResult> {
  const user = await me();
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const [mm, yy] = parsed.data.expiry.split("/").map((x) => Number(x.trim()));
  const tok = await paymentGateway.tokenizeCard({ number: parsed.data.number, expMonth: mm!, expYear: 2000 + yy!, cvc: parsed.data.cvc, holderName: parsed.data.holderName });
  if (!tok.ok) return { ok: false, error: tok.message, fieldErrors: { number: [tok.message] } };
  const count = (await db.query.paymentMethods.findMany({ where: eq(schema.paymentMethods.userId, user.id), columns: { id: true } })).length;
  const [row] = await db
    .insert(schema.paymentMethods)
    .values({
      userId: user.id,
      type: "card",
      brand: tok.card.brand,
      last4: tok.card.last4,
      expMonth: tok.card.expMonth,
      expYear: tok.card.expYear,
      holderName: parsed.data.holderName,
      gatewayToken: tok.card.token,
    })
    .returning({ id: schema.paymentMethods.id });
  if (input.makeDefault || count === 0) await setDefault("paymentMethods", user.id, row!.id);
  revalidatePath("/account/payments");
  return { ok: true, message: `Card ending ${tok.card.last4} saved.` };
}

export async function addWallet(input: { provider: "upi" | "vanikpay"; handle: string }): Promise<FormResult> {
  const user = await me();
  let handle: string;
  if (input.provider === "upi") {
    const upi = upiSchema.safeParse(input.handle);
    if (!upi.success) return { ok: false, error: "Enter a valid UPI ID", fieldErrors: { handle: ["Enter a valid UPI ID, e.g. name@okhdfcbank"] } };
    handle = upi.data.toLowerCase();
  } else {
    const email = z.email("Enter a valid email").safeParse(input.handle.trim());
    if (!email.success) return { ok: false, error: "Enter a valid email", fieldErrors: { handle: ["Enter a valid email"] } };
    handle = email.data;
  }
  await db.insert(schema.paymentMethods).values({
    userId: user.id,
    type: "wallet",
    brand: input.provider,
    email: handle,
    gatewayToken: `wal_mock_${input.provider}_${crypto.randomUUID().slice(0, 8)}`,
  });
  revalidatePath("/account/payments");
  return { ok: true, message: input.provider === "upi" ? `UPI ID ${handle} linked.` : "Vanik Wallet connected." };
}

export async function setDefaultPaymentMethod(id: string): Promise<FormResult> {
  const user = await me();
  await setDefault("paymentMethods", user.id, id);
  revalidatePath("/account/payments");
  return { ok: true, message: "Default payment method updated." };
}

export async function deletePaymentMethod(id: string): Promise<FormResult> {
  const user = await me();
  const row = await db.query.paymentMethods.findFirst({ where: and(eq(schema.paymentMethods.id, id), eq(schema.paymentMethods.userId, user.id)) });
  if (!row) return { ok: false, error: "Payment method not found." };
  await db.delete(schema.paymentMethods).where(eq(schema.paymentMethods.id, id));
  if (row.isDefault) {
    const next = await db.query.paymentMethods.findFirst({ where: eq(schema.paymentMethods.userId, user.id) });
    if (next) await setDefault("paymentMethods", user.id, next.id);
  }
  revalidatePath("/account/payments");
  return { ok: true, message: "Payment method removed." };
}

export async function markNotificationRead(id: string) {
  const user = await me();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<FormResult> {
  const user = await me();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
  revalidatePath("/", "layout");
  return { ok: true, message: "All caught up." };
}

export async function updateNotificationPrefs(prefs: NotificationPrefsMap): Promise<FormResult> {
  const user = await me();
  const clean = Object.fromEntries(
    Object.keys(defaultNotificationPrefs).map((k) => {
      const p = prefs[k as keyof NotificationPrefsMap];
      return [k, { inApp: !!p?.inApp, email: !!p?.email }];
    }),
  ) as NotificationPrefsMap;
  await db
    .insert(schema.notificationPrefs)
    .values({ userId: user.id, prefs: clean })
    .onConflictDoUpdate({ target: schema.notificationPrefs.userId, set: { prefs: clean } });
  revalidatePath("/account/notifications");
  return { ok: true, message: "Preferences saved." };
}

export async function cancelMyStoreOrder(storeOrderId: string): Promise<FormResult> {
  const user = await me();
  const so = await db.query.storeOrders.findFirst({
    where: eq(schema.storeOrders.id, storeOrderId),
    with: { order: true, store: true, items: true },
  });
  if (!so || so.order.userId !== user.id) return { ok: false, error: "Order not found." };
  if (!["placed", "confirmed"].includes(so.status)) return { ok: false, error: "This shipment is already being packed and can’t be cancelled. Contact the shop for help." };

  await db.transaction(async (tx) => {
    await tx.update(schema.storeOrders).set({ status: "cancelled" }).where(eq(schema.storeOrders.id, so.id));
    await tx.insert(schema.orderEvents).values({ storeOrderId: so.id, status: "cancelled", note: "Cancelled by the customer. A refund has been issued to the original payment method." });
    for (const it of so.items) {
      if (it.variantId) {
        const v = await tx.query.productVariants.findFirst({ where: eq(schema.productVariants.id, it.variantId) });
        if (v) await tx.update(schema.productVariants).set({ stock: v.stock + it.quantity }).where(eq(schema.productVariants.id, v.id));
      }
    }
    const siblings = await tx.query.storeOrders.findMany({ where: eq(schema.storeOrders.orderId, so.orderId) });
    if (siblings.every((s) => s.id === so.id || s.status === "cancelled")) {
      await tx.update(schema.orders).set({ paymentStatus: "refunded" }).where(eq(schema.orders.id, so.orderId));
    }
  });
  if (so.order.gatewayChargeId) await paymentGateway.refund(so.order.gatewayChargeId);
  await notify({
    userId: so.store.ownerId,
    type: "order",
    title: "Order cancelled by customer",
    body: `${so.order.number} was cancelled before fulfilment. Stock has been restored.`,
    href: `/vendor/orders/${so.id}`,
  });
  revalidatePath(`/account/orders/${so.orderId}`);
  revalidatePath("/account/orders");
  return { ok: true, message: `Your ${so.store.name} items were cancelled and refunded.` };
}
