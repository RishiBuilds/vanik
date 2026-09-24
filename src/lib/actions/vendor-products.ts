"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, like, ne, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getVendorContext } from "@/lib/session";
import { storage, MAX_UPLOAD_BYTES } from "@/lib/services/storage";
import { getOwnedVariantIds } from "@/lib/queries/vendor-products";
import { slugify } from "@/lib/utils";

export type FieldErrors = Record<string, string[] | undefined>;
export type ActionResult<T extends object = object> =
  | ({ ok: true; message?: string } & T)
  | { ok: false; error: string; fieldErrors?: FieldErrors };

const p = schema.products;
const v = schema.productVariants;

const NOT_ALLOWED = { ok: false as const, error: "You need a seller account to do that." };

function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

async function ownedProducts(storeId: string, ids: string[]) {
  if (!ids.length) return [];
  return db
    .select({ id: p.id, slug: p.slug, title: p.title, status: p.status })
    .from(p)
    .where(and(eq(p.storeId, storeId), inArray(p.id, ids)));
}

function revalidateProducts(storeSlug: string, productSlugs: string[] = [], productIds: string[] = []) {
  revalidatePath("/vendor", "layout");
  revalidatePath("/vendor/products");
  revalidatePath("/vendor/inventory");
  for (const id of productIds) revalidatePath(`/vendor/products/${id}`);
  for (const slug of productSlugs) revalidatePath(`/p/${slug}`);
  revalidatePath(`/s/${storeSlug}`);
  revalidatePath("/search");
}

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "product";
  const taken = await db
    .select({ slug: p.slug })
    .from(p)
    .where(and(or(eq(p.slug, base), like(p.slug, `${base}-%`)), excludeId ? ne(p.id, excludeId) : undefined));
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) if (!set.has(`${base}-${i}`)) return `${base}-${i}`;
}

function skuPrefix(title: string) {
  const words = title.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const initials = words.map((w) => w[0]).join("").slice(0, 4);
  return initials.length >= 2 ? initials : (words[0] ?? "SKU").slice(0, 4);
}

function skuPart(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "X";
}

const moneyRe = /^\d{1,7}(\.\d{1,2})?$/;
const cleanMoney = (s: string) => s.replace(/[$,\s]/g, "");
const moneyRequired = z
  .string()
  .transform(cleanMoney)
  .refine((s) => s.length > 0, "Enter a price")
  .refine((s) => !s || moneyRe.test(s), "Enter an amount like 24.00")
  .transform((s) => Math.round(Number(s) * 100))
  .refine((c) => c >= 100, "Price must be at least ₹1");
const moneyOptional = z
  .string()
  .transform(cleanMoney)
  .refine((s) => !s || moneyRe.test(s), "Enter an amount like 24.00")
  .transform((s) => (s ? Math.round(Number(s) * 100) : null));
const wholeNumber = (label: string) =>
  z
    .string()
    .trim()
    .refine((s) => /^\d{1,6}$/.test(s), `${label} must be a whole number`)
    .transform(Number);

const productSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3, "Give your product a title (at least 3 characters)").max(120, "Keep titles under 120 characters"),
    summary: z.string().trim().max(200, "Keep the summary under 200 characters"),
    description: z.string().trim().max(8000, "Description is too long"),
    categoryId: z.string().min(1, "Choose a category"),
    status: z.enum(["active", "draft", "archived"]),
    tags: z.array(z.string().trim().min(1).max(32, "Tags must be under 32 characters")).max(15, "Use up to 15 tags"),
    specs: z
      .array(
        z.object({
          label: z.string().trim().max(40, "Keep labels short"),
          value: z.string().trim().max(200, "Keep values under 200 characters"),
        }),
      )
      .max(20, "Use up to 20 specifications"),
    options: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Name this option").max(30, "Keep option names short"),
          values: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one value").max(20, "Up to 20 values"),
        }),
      )
      .max(3, "Use up to 3 options"),
    images: z
      .array(
        z.object({
          url: z
            .string()
            .refine((u) => u.startsWith("/uploads/") || u.startsWith("https://images.unsplash.com/"), "Unsupported image source"),
          alt: z.string().max(200).optional(),
        }),
      )
      .max(12, "Use up to 12 images"),
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          attributes: z.record(z.string(), z.string()),
          sku: z
            .string()
            .trim()
            .max(40, "Keep SKUs under 40 characters")
            .refine((s) => /^[A-Za-z0-9._-]*$/.test(s), "Use letters, numbers, dashes, dots or underscores")
            .transform((s) => s.toUpperCase()),
          price: moneyRequired,
          compareAtPrice: moneyOptional,
          stock: wholeNumber("Stock"),
          lowStockThreshold: wholeNumber("Threshold"),
        }),
      )
      .min(1, "Add at least one variant")
      .max(100, "Up to 100 variants"),
  })
  .superRefine((d, ctx) => {
    const names = new Set<string>();
    d.options.forEach((o, i) => {
      const k = o.name.toLowerCase();
      if (names.has(k)) ctx.addIssue({ code: "custom", path: ["options", i, "name"], message: "Option names must be unique" });
      names.add(k);
      const vals = new Set(o.values.map((x) => x.toLowerCase()));
      if (vals.size !== o.values.length) ctx.addIssue({ code: "custom", path: ["options", i, "values"], message: "Values must be unique" });
    });
    const expected = d.options.reduce((n, o) => n * o.values.length, 1);
    if (d.variants.length !== expected)
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Variants are out of sync with options — refresh the variant table." });
    const combos = new Set<string>();
    d.variants.forEach((vr, i) => {
      const keys = Object.keys(vr.attributes);
      const ok =
        keys.length === d.options.length &&
        d.options.every((o) => o.values.includes(vr.attributes[o.name] ?? "\u0000"));
      if (!ok) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "This variant doesn’t match the options" });
      const key = d.options.map((o) => vr.attributes[o.name]).join("\u0000");
      if (combos.has(key)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "Duplicate variant" });
      combos.add(key);
      if (vr.compareAtPrice != null && vr.compareAtPrice <= vr.price)
        ctx.addIssue({ code: "custom", path: ["variants", i, "compareAtPrice"], message: "Must be higher than the price" });
    });
    d.specs.forEach((s, i) => {
      if (!s.label && s.value) ctx.addIssue({ code: "custom", path: ["specs", i, "label"], message: "Add a label" });
      if (s.label && !s.value) ctx.addIssue({ code: "custom", path: ["specs", i, "value"], message: "Add a value" });
    });
    if (d.status === "active" && d.images.length === 0)
      ctx.addIssue({ code: "custom", path: ["images"], message: "Add at least one photo before publishing" });
  });

export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const d = parsed.data;

  let existing: { id: string; slug: string } | null = null;
  if (d.id) {
    const [row] = await ownedProducts(ctx.store.id, [d.id]);
    if (!row) return { ok: false, error: "Product not found." };
    existing = row;
  }

  const cat = await db.query.categories.findFirst({ where: eq(schema.categories.id, d.categoryId) });
  if (!cat || !cat.parentId) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { categoryId: ["Choose a subcategory"] } };

  const current = existing
    ? await db.select({ id: v.id, attributes: v.attributes, sku: v.sku }).from(v).where(eq(v.productId, existing.id))
    : [];
  const comboKey = (attrs: Record<string, string>) =>
    d.options.map((o) => `${o.name}=${attrs[o.name] ?? ""}`).join("\u0000");
  const unmatched = new Map(current.map((c) => [c.id, c]));
  const variants = d.variants.map((vr) => {
    let id: string | undefined;
    if (vr.id && unmatched.has(vr.id)) id = vr.id;
    else {
      const k = comboKey(vr.attributes);
      const hit = [...unmatched.values()].find((c) => comboKey(c.attributes) === k);
      id = hit?.id;
    }
    if (id) unmatched.delete(id);
    return { ...vr, id };
  });

  const fieldErrors: FieldErrors = {};
  const seen = new Map<string, number>();
  variants.forEach((vr, i) => {
    if (!vr.sku) return;
    if (seen.has(vr.sku)) fieldErrors[`variants.${i}.sku`] = ["Each variant needs its own SKU"];
    seen.set(vr.sku, i);
  });
  const provided = variants.map((x) => x.sku).filter(Boolean);
  const conflictRows = provided.length
    ? await db
        .select({ sku: v.sku, productId: v.productId, title: p.title, storeId: p.storeId })
        .from(v)
        .innerJoin(p, eq(p.id, v.productId))
        .where(and(inArray(v.sku, provided), existing ? ne(v.productId, existing.id) : undefined))
    : [];
  for (const c of conflictRows) {
    const i = seen.get(c.sku)!;
    fieldErrors[`variants.${i}.sku`] = [
      c.storeId === ctx.store.id ? `Already used by “${c.title}”` : "This SKU is already taken — try another",
    ];
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Some SKUs are already in use. Each SKU must be unique.", fieldErrors };
  }
  const blanks = variants.filter((x) => !x.sku);
  if (blanks.length) {
    const prefix = skuPrefix(d.title);
    const candidates = blanks.map((b) =>
      [prefix, ...d.options.map((o) => skuPart(b.attributes[o.name] ?? ""))].join("-"),
    );
    const taken = new Set(
      (
        await db
          .select({ sku: v.sku })
          .from(v)
          .where(and(or(...candidates.map((c) => like(v.sku, `${c}%`))), existing ? ne(v.productId, existing.id) : undefined))
      ).map((r) => r.sku),
    );
    provided.forEach((s) => taken.add(s));
    blanks.forEach((b, i) => {
      let sku = candidates[i]!;
      for (let n = 2; taken.has(sku); n++) sku = `${candidates[i]}-${n}`;
      taken.add(sku);
      b.sku = sku;
    });
  }

  const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
  const specs = d.specs.filter((s) => s.label && s.value);
  const tags = [...new Set(d.tags.map((t) => t.toLowerCase()))];
  const slug = existing ? existing.slug : await uniqueSlug(d.title);
  const values = {
    categoryId: d.categoryId,
    title: d.title,
    summary: d.summary,
    description: d.description,
    specs,
    options: d.options,
    tags,
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    status: d.status,
  };

  let productId = existing?.id ?? "";
  try {
    await db.transaction(async (tx) => {
      if (existing) {
        await tx.update(p).set({ ...values, updatedAt: new Date() }).where(eq(p.id, existing.id));
      } else {
        const [row] = await tx
          .insert(p)
          .values({ ...values, storeId: ctx.store.id, slug })
          .returning({ id: p.id });
        productId = row!.id;
      }

      const removed = [...unmatched.keys()];
      if (removed.length) await tx.delete(v).where(inArray(v.id, removed));
      const kept = variants.filter((x) => x.id);
      for (const k of kept) await tx.update(v).set({ sku: `__tmp__${k.id}` }).where(eq(v.id, k.id!));
      for (const [position, vr] of variants.entries()) {
        const row = {
          sku: vr.sku,
          attributes: vr.attributes,
          price: vr.price,
          compareAtPrice: vr.compareAtPrice,
          stock: vr.stock,
          lowStockThreshold: vr.lowStockThreshold,
          position,
        };
        if (vr.id) await tx.update(v).set(row).where(eq(v.id, vr.id));
        else await tx.insert(v).values({ ...row, productId });
      }

      await tx.delete(schema.productImages).where(eq(schema.productImages.productId, productId));
      if (d.images.length) {
        await tx.insert(schema.productImages).values(
          d.images.map((img, position) => ({ productId, url: img.url, alt: img.alt?.trim() || d.title, position })),
        );
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE/i.test(msg) && /sku/i.test(msg)) return { ok: false, error: "One of the SKUs was just taken. Try a different SKU." };
    console.error("saveProduct failed", e);
    return { ok: false, error: "Couldn’t save the product. Please try again." };
  }

  revalidateProducts(ctx.store.slug, [slug], [productId]);
  return { ok: true, id: productId, slug, message: existing ? "Product saved." : "Product created." };
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function uploadProductImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: `${file.name}: only JPG, PNG, WebP, AVIF or GIF images are allowed.` };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name} is larger than 5 MB.` };
  try {
    const url = await storage.put(file, "products");
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function setProductsStatus(ids: string[], status: "active" | "draft" | "archived"): Promise<ActionResult<{ skipped: number }>> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  if (!["active", "draft", "archived"].includes(status)) return { ok: false, error: "Unknown status." };
  const owned = await ownedProducts(ctx.store.id, ids);
  if (!owned.length) return { ok: false, error: "No products selected." };

  let targets = owned;
  let skipped = 0;
  if (status === "active") {
    const withImages = new Set(
      (
        await db
          .selectDistinct({ id: schema.productImages.productId })
          .from(schema.productImages)
          .where(inArray(schema.productImages.productId, owned.map((o) => o.id)))
      ).map((r) => r.id),
    );
    targets = owned.filter((o) => withImages.has(o.id));
    skipped = owned.length - targets.length;
    if (!targets.length) return { ok: false, error: "Add at least one photo before publishing." };
  }
  await db
    .update(p)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(p.storeId, ctx.store.id), inArray(p.id, targets.map((t) => t.id))));
  revalidateProducts(ctx.store.slug, targets.map((t) => t.slug), targets.map((t) => t.id));
  const verb = status === "active" ? "published" : status === "draft" ? "moved to draft" : "archived";
  const n = targets.length;
  return {
    ok: true,
    skipped,
    message: `${n} product${n === 1 ? "" : "s"} ${verb}.${skipped ? ` ${skipped} skipped (no photos).` : ""}`,
  };
}

export async function deleteProducts(ids: string[]): Promise<ActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  const owned = await ownedProducts(ctx.store.id, ids);
  if (!owned.length) return { ok: false, error: "No products selected." };
  await db.delete(p).where(and(eq(p.storeId, ctx.store.id), inArray(p.id, owned.map((o) => o.id))));
  revalidateProducts(ctx.store.slug, owned.map((o) => o.slug), owned.map((o) => o.id));
  const n = owned.length;
  return { ok: true, message: n === 1 ? `“${owned[0]!.title}” deleted.` : `${n} products deleted.` };
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  const src = await db.query.products.findFirst({
    where: and(eq(p.id, id), eq(p.storeId, ctx.store.id)),
    with: { images: true, variants: true },
  });
  if (!src) return { ok: false, error: "Product not found." };

  const title = `${src.title} (copy)`.slice(0, 120);
  const slug = await uniqueSlug(title);
  const allSkus = new Set(
    (
      await db
        .select({ sku: v.sku })
        .from(v)
        .where(or(...src.variants.map((x) => like(v.sku, `${x.sku}-COPY%`))))
    ).map((r) => r.sku),
  );
  const newSkus = src.variants.map((x) => {
    let sku = `${x.sku}-COPY`;
    for (let n = 2; allSkus.has(sku); n++) sku = `${x.sku}-COPY${n}`;
    allSkus.add(sku);
    return sku;
  });

  let newId = "";
  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(p)
      .values({
        storeId: src.storeId,
        categoryId: src.categoryId,
        slug,
        title,
        summary: src.summary,
        description: src.description,
        specs: src.specs,
        options: src.options,
        tags: src.tags,
        price: src.price,
        compareAtPrice: src.compareAtPrice,
        status: "draft",
      })
      .returning({ id: p.id });
    newId = row!.id;
    if (src.images.length)
      await tx
        .insert(schema.productImages)
        .values(src.images.map((img) => ({ productId: newId, url: img.url, alt: img.alt, position: img.position })));
    if (src.variants.length)
      await tx.insert(v).values(
        src.variants.map((x, i) => ({
          productId: newId,
          sku: newSkus[i]!,
          attributes: x.attributes,
          price: x.price,
          compareAtPrice: x.compareAtPrice,
          stock: 0,
          lowStockThreshold: x.lowStockThreshold,
          position: x.position,
        })),
      );
  });
  revalidateProducts(ctx.store.slug);
  return { ok: true, id: newId, message: `Created draft “${title}”.` };
}

const stockValue = z.number().int("Whole numbers only").min(0, "Can’t be negative").max(999_999, "That’s a lot — max 999,999");

export async function updateVariantInventory(
  variantId: string,
  input: { stock?: number; lowStockThreshold?: number },
): Promise<ActionResult<{ stock: number; lowStockThreshold: number }>> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  const parsed = z.object({ stock: stockValue.optional(), lowStockThreshold: stockValue.optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid value." };
  const [owned] = await getOwnedVariantIds(ctx.store.id, [variantId]);
  if (!owned) return { ok: false, error: "Variant not found." };
  const set: { stock?: number; lowStockThreshold?: number } = {};
  if (parsed.data.stock != null) set.stock = parsed.data.stock;
  if (parsed.data.lowStockThreshold != null) set.lowStockThreshold = parsed.data.lowStockThreshold;
  if (!Object.keys(set).length) return { ok: false, error: "Nothing to update." };
  const [row] = await db
    .update(v)
    .set(set)
    .where(eq(v.id, variantId))
    .returning({ stock: v.stock, lowStockThreshold: v.lowStockThreshold, productId: v.productId, sku: v.sku });
  await touchProducts([row!.productId]);
  const [prod] = await ownedProducts(ctx.store.id, [row!.productId]);
  revalidateProducts(ctx.store.slug, prod ? [prod.slug] : [], [row!.productId]);
  return { ok: true, stock: row!.stock, lowStockThreshold: row!.lowStockThreshold, message: `${row!.sku} updated.` };
}

export async function restockVariants(ids: string[], mode: "add" | "set", quantity: number): Promise<ActionResult> {
  const ctx = await getVendorContext();
  if (!ctx) return NOT_ALLOWED;
  const q = stockValue.safeParse(quantity);
  if (!q.success) return { ok: false, error: q.error.issues[0]?.message ?? "Invalid quantity." };
  if (mode === "add" && q.data === 0) return { ok: false, error: "Enter how many units to add." };
  const owned = await getOwnedVariantIds(ctx.store.id, ids);
  if (!owned.length) return { ok: false, error: "No SKUs selected." };
  const rows = await db.select({ id: v.id, stock: v.stock, productId: v.productId }).from(v).where(inArray(v.id, owned));
  await db.transaction(async (tx) => {
    for (const r of rows) {
      const next = mode === "add" ? Math.min(999_999, Math.max(0, r.stock) + q.data) : q.data;
      await tx.update(v).set({ stock: next }).where(eq(v.id, r.id));
    }
  });
  const productIds = [...new Set(rows.map((r) => r.productId))];
  await touchProducts(productIds);
  const prods = await ownedProducts(ctx.store.id, productIds);
  revalidateProducts(ctx.store.slug, prods.map((x) => x.slug), productIds);
  const n = rows.length;
  return {
    ok: true,
    message: mode === "add" ? `Added ${q.data} units to ${n} SKU${n === 1 ? "" : "s"}.` : `Set ${n} SKU${n === 1 ? "" : "s"} to ${q.data} units.`,
  };
}

async function touchProducts(ids: string[]) {
  if (ids.length) await db.update(p).set({ updatedAt: new Date() }).where(inArray(p.id, ids));
}
