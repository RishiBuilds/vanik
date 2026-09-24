"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import type { PayoutMethod } from "@/lib/db/schema";
import { getSessionUser, getVendorContext, getVendorStore } from "@/lib/session";
import { notify } from "@/lib/services/notifications";
import { storage } from "@/lib/services/storage";
import { slugify } from "@/lib/utils";
import { CARRIERS } from "@/lib/services/shipping";
import { upiSchema } from "@/lib/validation";

export type StoreActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const NO_STORE: StoreActionResult = { ok: false, error: "You need to be signed in to a seller account with a shop." };
const invalid = (error: z.ZodError): StoreActionResult => ({
  ok: false,
  error: "Please fix the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
});

const replySchema = z.object({
  reviewId: z.string().min(1),
  response: z.string().trim().min(2, "Write a short reply").max(1000, "Keep replies under 1,000 characters"),
});

export async function respondToReview(input: z.input<typeof replySchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const review = await db.query.reviews.findFirst({
    where: and(eq(schema.reviews.id, parsed.data.reviewId), eq(schema.reviews.storeId, ctx.store.id)),
    with: { product: { columns: { slug: true, title: true } } },
  });
  if (!review) return { ok: false, error: "Review not found." };
  const editing = !!review.vendorResponse;
  await db
    .update(schema.reviews)
    .set({ vendorResponse: parsed.data.response, respondedAt: new Date() })
    .where(eq(schema.reviews.id, review.id));
  await notify({
    userId: review.userId,
    type: "review",
    title: editing ? `${ctx.store.name} updated their reply` : `${ctx.store.name} replied to your review`,
    body: `On “${review.product.title}”: ${parsed.data.response.slice(0, 140)}${parsed.data.response.length > 140 ? "…" : ""}`,
    href: `/p/${review.product.slug}#reviews`,
  });
  revalidatePath("/vendor", "layout");
  revalidatePath(`/p/${review.product.slug}`);
  return { ok: true, message: editing ? "Reply updated." : "Reply posted. The reviewer has been notified." };
}

const payoutSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bank"),
    holderName: z.string().trim().min(2, "Enter the account holder’s name").max(80),
    bankName: z.string().trim().min(2, "Enter the bank name").max(80),
    ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC codes look like HDFC0001234"),
    accountNumber: z.string().trim().regex(/^\d{9,18}$/, "Indian account numbers are 9–18 digits"),
  }),
  z.object({
    type: z.literal("upi"),
    holderName: z.string().trim().min(2, "Enter the account holder’s name").max(80),
    upiId: upiSchema,
  }),
]);

export async function updatePayoutMethod(input: z.input<typeof payoutSchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = payoutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const method: PayoutMethod =
    d.type === "bank"
      ? { type: "bank", holderName: d.holderName, bankName: d.bankName, accountLast4: d.accountNumber.slice(-4) }
      : { type: "upi", holderName: d.holderName, upiId: d.upiId.toLowerCase() };
  await db.update(schema.stores).set({ payoutMethod: method }).where(eq(schema.stores.id, ctx.store.id));
  revalidatePath("/vendor/payouts");
  return {
    ok: true,
    message: method.type === "bank" ? `Payouts will go to ${method.bankName} •••• ${method.accountLast4}.` : `Payouts will go to ${method.upiId}.`,
  };
}


const rateSchema = z
  .object({
    id: z.string().optional(),
    zone: z.string().trim().min(2, "Name the zone").max(40),
    regions: z.array(z.string().trim().toUpperCase().min(2).max(3)).min(1, "Add at least one region").max(30),
    name: z.string().trim().min(2, "Name this rate").max(50),
    carrier: z.enum(CARRIERS, "Choose a carrier"),
    price: z.number("Enter a price").min(0, "Price can’t be negative").max(1000),
    freeOver: z.number().min(1, "Enter an amount above ₹0").max(100000).nullable(),
    minDays: z.number("Required").int("Whole days only").min(0).max(90),
    maxDays: z.number("Required").int("Whole days only").min(1, "At least 1 day").max(120),
    active: z.boolean(),
  })
  .refine((v) => v.minDays <= v.maxDays, { path: ["maxDays"], message: "Must be at least the minimum" });

async function leavesNoDomestic(storeId: string, rateId: string, next: { zone: string; active: boolean } | null) {
  const rates = await db.query.shippingRates.findMany({ where: eq(schema.shippingRates.storeId, storeId) });
  const target = rates.find((r) => r.id === rateId);
  if (!target || target.zone !== "Domestic" || !target.active) return false;
  if (next && next.zone === "Domestic" && next.active) return false;
  return !rates.some((r) => r.id !== rateId && r.zone === "Domestic" && r.active);
}

export async function saveShippingRate(input: z.input<typeof rateSchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const values = {
    zone: d.zone,
    regions: [...new Set(d.regions)],
    name: d.name,
    carrier: d.carrier,
    price: Math.round(d.price * 100),
    freeOver: d.freeOver == null ? null : Math.round(d.freeOver * 100),
    minDays: d.minDays,
    maxDays: d.maxDays,
    active: d.active,
  };
  if (d.id) {
    const owned = await db.query.shippingRates.findFirst({
      where: and(eq(schema.shippingRates.id, d.id), eq(schema.shippingRates.storeId, ctx.store.id)),
    });
    if (!owned) return { ok: false, error: "Rate not found." };
    if (await leavesNoDomestic(ctx.store.id, d.id, { zone: d.zone, active: d.active }))
      return { ok: false, error: "Keep at least one active Domestic rate so shoppers can check out." };
    await db.update(schema.shippingRates).set(values).where(eq(schema.shippingRates.id, d.id));
  } else {
    await db.insert(schema.shippingRates).values({ storeId: ctx.store.id, ...values });
  }
  revalidatePath("/vendor/shipping");
  revalidatePath(`/s/${ctx.store.slug}`);
  return { ok: true, message: d.id ? "Rate updated." : "Rate added." };
}

export async function toggleShippingRate(id: string, active: boolean): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const rate = await db.query.shippingRates.findFirst({
    where: and(eq(schema.shippingRates.id, id), eq(schema.shippingRates.storeId, ctx.store.id)),
  });
  if (!rate) return { ok: false, error: "Rate not found." };
  if (!active && (await leavesNoDomestic(ctx.store.id, id, { zone: rate.zone, active: false })))
    return { ok: false, error: "Keep at least one active Domestic rate so shoppers can check out." };
  await db.update(schema.shippingRates).set({ active }).where(eq(schema.shippingRates.id, id));
  revalidatePath("/vendor/shipping");
  return { ok: true, message: `${rate.name} ${active ? "is now offered at checkout" : "is hidden from checkout"}.` };
}

export async function deleteShippingRate(id: string): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const rate = await db.query.shippingRates.findFirst({
    where: and(eq(schema.shippingRates.id, id), eq(schema.shippingRates.storeId, ctx.store.id)),
  });
  if (!rate) return { ok: false, error: "Rate not found." };
  if (await leavesNoDomestic(ctx.store.id, id, null))
    return { ok: false, error: "This is your last active Domestic rate. Add another one before deleting it." };
  await db.delete(schema.shippingRates).where(eq(schema.shippingRates.id, id));
  revalidatePath("/vendor/shipping");
  return { ok: true, message: "Rate deleted." };
}

export async function uploadStoreImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "vendor") return { ok: false, error: "Only seller accounts can upload store images." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  try {
    const url = await storage.put(file, "stores");
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

const imageUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/uploads/stores/") || v.startsWith("https://images.unsplash.com/"), "Upload an image")
  .transform((v) => v || null);

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #a8461f").transform((v) => v.toLowerCase());

const brandingSchema = z.object({
  name: z.string().trim().min(2, "Store names need at least 2 characters").max(60),
  tagline: z.string().trim().max(120, "Keep it under 120 characters"),
  description: z.string().trim().max(2000),
  brandColor: hex,
  location: z.string().trim().max(80),
  supportEmail: z.union([z.literal(""), z.email("Enter a valid email")]),
  logo: imageUrl,
  banner: imageUrl,
});

export async function updateBranding(input: z.input<typeof brandingSchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  await db
    .update(schema.stores)
    .set({ ...d, supportEmail: d.supportEmail || null })
    .where(eq(schema.stores.id, ctx.store.id));
  revalidatePath("/vendor", "layout");
  revalidatePath(`/s/${ctx.store.slug}`);
  return { ok: true, message: "Branding saved." };
}

const policiesSchema = z.object({
  processingTime: z.string().trim().min(2, "Tell buyers how long you take to ship").max(60),
  shipping: z.string().trim().max(2000),
  returns: z.string().trim().max(2000),
});

export async function updatePolicies(input: z.input<typeof policiesSchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = policiesSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await db.update(schema.stores).set({ policies: parsed.data }).where(eq(schema.stores.id, ctx.store.id));
  revalidatePath("/vendor/settings");
  revalidatePath("/vendor/shipping");
  revalidatePath(`/s/${ctx.store.slug}`);
  return { ok: true, message: "Policies saved." };
}

const staffRole = z.enum(["admin", "editor", "fulfillment"], "Choose a role");
const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(80),
  email: z.email("Enter a valid email"),
  role: staffRole,
});

export async function inviteStaff(input: z.input<typeof inviteSchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const email = parsed.data.email.toLowerCase();
  const existing = await db.query.storeStaff.findFirst({
    where: and(eq(schema.storeStaff.storeId, ctx.store.id), eq(schema.storeStaff.email, email)),
  });
  if (existing) return { ok: false, error: "That person is already on your team.", fieldErrors: { email: ["Already on your team"] } };
  await db.insert(schema.storeStaff).values({ storeId: ctx.store.id, name: parsed.data.name, email, role: parsed.data.role, status: "invited" });
  revalidatePath("/vendor/settings");
  return { ok: true, message: `Invitation sent to ${email}.` };
}

export async function updateStaffRole(id: string, role: z.input<typeof staffRole>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const r = staffRole.safeParse(role);
  if (!r.success) return { ok: false, error: "Choose a valid role." };
  const member = await db.query.storeStaff.findFirst({ where: and(eq(schema.storeStaff.id, id), eq(schema.storeStaff.storeId, ctx.store.id)) });
  if (!member) return { ok: false, error: "Team member not found." };
  if (member.email.toLowerCase() === ctx.user.email.toLowerCase()) return { ok: false, error: "The shop owner is always an admin." };
  await db.update(schema.storeStaff).set({ role: r.data }).where(eq(schema.storeStaff.id, id));
  revalidatePath("/vendor/settings");
  return { ok: true, message: `${member.name} is now ${r.data === "admin" ? "an" : "a"} ${r.data}.` };
}

export async function removeStaff(id: string): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const member = await db.query.storeStaff.findFirst({ where: and(eq(schema.storeStaff.id, id), eq(schema.storeStaff.storeId, ctx.store.id)) });
  if (!member) return { ok: false, error: "Team member not found." };
  if (member.email.toLowerCase() === ctx.user.email.toLowerCase()) return { ok: false, error: "You can’t remove the shop owner." };
  await db.delete(schema.storeStaff).where(eq(schema.storeStaff.id, id));
  revalidatePath("/vendor/settings");
  return { ok: true, message: member.status === "invited" ? "Invitation revoked." : `${member.name} was removed.` };
}

export async function setStoreStatus(status: "active" | "paused"): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  if (status !== "active" && status !== "paused") return { ok: false, error: "Unknown status." };
  await db.update(schema.stores).set({ status }).where(eq(schema.stores.id, ctx.store.id));
  revalidatePath("/", "layout");
  return { ok: true, message: status === "paused" ? "Your shop is paused and hidden from the marketplace." : "Your shop is live again." };
}

const TICKET_CATEGORIES = ["Orders", "Payouts", "Shipping", "Account", "Other"] as const;
const ticketSchema = z.object({
  category: z.enum(TICKET_CATEGORIES, "Choose a category"),
  subject: z.string().trim().min(4, "Add a short subject").max(120),
  message: z.string().trim().min(20, "Give us a little more detail (20+ characters)").max(4000),
});

export async function createSupportTicket(input: z.input<typeof ticketSchema>): Promise<StoreActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NO_STORE;
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await db.insert(schema.supportTickets).values({
    storeId: ctx.store.id,
    category: parsed.data.category,
    subject: parsed.data.subject,
    body: parsed.data.message,
    status: "open",
  });
  revalidatePath("/vendor/support");
  return { ok: true, message: "We’ll reply within one working day." };
}

export async function becomeVendor(): Promise<StoreActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  if (user.role === "vendor") return { ok: true };
  await db.update(schema.user).set({ role: "vendor" }).where(eq(schema.user.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Your account can now sell on Vanik." };
}

async function uniqueSlug(name: string, excludeStoreId?: string) {
  const base = slugify(name) || "shop";
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = await db.query.stores.findFirst({
      where: excludeStoreId ? and(eq(schema.stores.slug, candidate), ne(schema.stores.id, excludeStoreId)) : eq(schema.stores.slug, candidate),
      columns: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function checkStoreSlug(name: string): Promise<{ slug: string; available: boolean; suggestion: string }> {
  const slug = slugify(name);
  if (!slug) return { slug: "", available: false, suggestion: "" };
  const suggestion = await uniqueSlug(name);
  return { slug, available: suggestion === slug, suggestion };
}

const storeSchema = z.object({
  name: z.string().trim().min(2, "Store names need at least 2 characters").max(60),
  tagline: z.string().trim().min(4, "Add a one-line tagline").max(120),
  categoryId: z.string().min(1, "Choose a primary category"),
  location: z.string().trim().min(2, "Where are you based?").max(80),
  logo: imageUrl,
  banner: imageUrl,
  brandColor: hex,
  processingTime: z.string().trim().min(2, "Tell buyers how long you take to ship").max(60),
  shipping: z.string().trim().min(10, "Describe how you ship").max(2000),
  returns: z.string().trim().min(10, "Describe your returns policy").max(2000),
});

export type CreateStoreInput = z.input<typeof storeSchema>;

export async function createStore(input: CreateStoreInput): Promise<StoreActionResult & { slug?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  if (user.role !== "vendor") return { ok: false, error: "Upgrade to a seller account first." };
  if (await getVendorStore(user.id)) return { ok: false, error: "You already have a shop." };
  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const category = await db.query.categories.findFirst({ where: eq(schema.categories.id, d.categoryId) });
  if (!category || category.parentId) return { ok: false, error: "Choose a primary category.", fieldErrors: { categoryId: ["Choose a primary category"] } };

  const slug = await uniqueSlug(d.name);
  const storeId = await db.transaction(async (tx) => {
    const [store] = await tx
      .insert(schema.stores)
      .values({
        ownerId: user.id,
        slug,
        name: d.name,
        tagline: d.tagline,
        categoryId: d.categoryId,
        location: d.location,
        logo: d.logo,
        banner: d.banner,
        brandColor: d.brandColor,
        supportEmail: user.email,
        policies: { processingTime: d.processingTime, shipping: d.shipping, returns: d.returns },
      })
      .returning({ id: schema.stores.id });
    await tx.insert(schema.shippingRates).values([
      { storeId: store!.id, zone: "Domestic", regions: ["IN"], name: "Standard", carrier: "Delhivery", price: 7900, freeOver: 99900, minDays: 3, maxDays: 6 },
      { storeId: store!.id, zone: "Domestic", regions: ["IN"], name: "Express", carrier: "Blue Dart", price: 14900, freeOver: null, minDays: 1, maxDays: 2 },
    ]);
    await tx.insert(schema.storeStaff).values({ storeId: store!.id, name: user.name, email: user.email.toLowerCase(), role: "admin", status: "active" });
    return store!.id;
  });

  await notify({
    userId: user.id,
    type: "system",
    title: `Welcome to Vanik, ${d.name}!`,
    body: "Your shop is set up. Add your first product so buyers can find you — we’ve created two default shipping rates for India you can change any time.",
    href: "/vendor/products/new",
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Your shop is live!", slug: storeId ? slug : undefined };
}
