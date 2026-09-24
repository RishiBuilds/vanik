import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import type { FulfillmentStatus, ProductOption } from "../src/lib/db/schema";
import { computeTotals } from "../src/lib/services/pricing";
import { estimateDelivery, FULFILLMENT_FLOW, generateTrackingNumber, CARRIER_HUBS } from "../src/lib/services/shipping";
import { slugify, unsplash } from "../src/lib/utils";
import { AVATARS, CATEGORIES, CUSTOMERS, IMG, REVIEW_BANK, STORES, VENDOR_RESPONSES } from "./seed-data";

let seed = 20260923;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
const chance = (p: number) => rand() < p;
function weighted<T>(items: [T, number][]) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    if ((r -= w) <= 0) return item;
  }
  return items[items.length - 1]![0];
}
function sample<T>(arr: readonly T[], n: number) {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]!);
  return out;
}

const DAY = 86_400_000;
const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * DAY);
const img = (key: keyof typeof IMG, w = 1000, h?: number) => unsplash(IMG[key], w, h);
const avatar = (key?: keyof typeof AVATARS) => (key ? unsplash(AVATARS[key], 200, 200) : null);

async function insertChunked<T extends Record<string, unknown>>(table: Parameters<typeof db.insert>[0], rows: T[], size = 100) {
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size) as never);
  }
}

function cartesian(options: ProductOption[]): Record<string, string>[] {
  if (options.length === 0) return [{}];
  return options.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap((combo) => opt.values.map((v) => ({ ...combo, [opt.name]: v }))),
    [{}],
  );
}

async function wipe() {
  const tables = [
    "newsletter_subscribers", "notification_prefs", "notifications", "support_tickets", "store_daily_stats",
    "payouts", "shipping_rates", "order_events", "order_items", "store_orders", "orders", "promo_codes",
    "cart_items", "carts", "store_follows", "favorites", "payment_methods", "addresses", "reviews",
    "product_variants", "product_images", "products", "store_staff", "stores", "categories",
    "verification", "account", "session", "user",
  ];
  await db.run(sql.raw("PRAGMA foreign_keys = OFF"));
  for (const t of tables) await db.run(sql.raw(`DELETE FROM "${t}"`));
  await db.run(sql.raw("PRAGMA foreign_keys = ON"));
}

async function main() {
  console.log("› wiping existing data");
  await wipe();

  const passwordHash = await hashPassword("vanik-demo");

  console.log("› users");
  type U = typeof schema.user.$inferInsert;
  const users: U[] = [];
  const vendorIds = new Map<string, string>();
  for (const s of STORES) {
    const id = crypto.randomUUID();
    vendorIds.set(s.slug, id);
    users.push({
      id, name: s.owner.name, email: s.owner.email, emailVerified: true, role: "vendor",
      image: avatar(s.owner.avatar), createdAt: daysAgo(int(200, 700)),
    });
  }
  const customerIds: string[] = [];
  for (const c of CUSTOMERS) {
    const id = crypto.randomUUID();
    customerIds.push(id);
    users.push({ id, name: c.name, email: c.email, emailVerified: true, role: "customer", image: c.image ?? avatar(c.avatar), createdAt: daysAgo(int(130, 500)) });
  }
  await insertChunked(schema.user, users);
  await insertChunked(
    schema.account,
    users.map((u) => ({ id: crypto.randomUUID(), accountId: u.id, providerId: "credential", userId: u.id, password: passwordHash })),
  );
  const demoCustomerId = customerIds[0]!;
  const demoVendorId = vendorIds.get("mitti-studio")!;
  const reviewerPool = [...customerIds, ...[...vendorIds.values()].slice(1, 4)];

  console.log("› categories");
  const catIds = new Map<string, string>();
  const catRows: (typeof schema.categories.$inferInsert)[] = [];
  CATEGORIES.forEach((c, i) => {
    const id = crypto.randomUUID();
    catIds.set(c.slug, id);
    catRows.push({ id, slug: c.slug, name: c.name, description: c.description, image: img(c.image, 900, 1100), position: i });
    c.children.forEach((ch, j) => {
      const cid = crypto.randomUUID();
      catIds.set(ch.slug, cid);
      catRows.push({ id: cid, slug: ch.slug, name: ch.name, image: img(ch.image, 600, 600), parentId: id, position: j });
    });
  });
  await insertChunked(schema.categories, catRows);

  console.log("› stores & products");
  type ProductRow = typeof schema.products.$inferInsert & { id: string };
  type VariantRow = typeof schema.productVariants.$inferInsert & { id: string; stock: number; price: number };
  const storeRows: (typeof schema.stores.$inferInsert & { id: string })[] = [];
  const productRows: ProductRow[] = [];
  const imageRows: (typeof schema.productImages.$inferInsert)[] = [];
  const variantRows: VariantRow[] = [];
  const rateRows: (typeof schema.shippingRates.$inferInsert)[] = [];
  const skus = new Set<string>();

  STORES.forEach((s, si) => {
    const storeId = crypto.randomUUID();
    storeRows.push({
      id: storeId,
      ownerId: vendorIds.get(s.slug)!,
      slug: s.slug,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      logo: img(s.logo, 240, 240),
      banner: img(s.banner, 1800, 600),
      brandColor: s.brandColor,
      categoryId: catIds.get(s.category),
      location: s.location,
      policies: s.policies,
      supportEmail: `hello@${s.slug.replace(/-/g, "")}.example`,
      payoutMethod: chance(0.8)
        ? { type: "bank", bankName: pick(["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"]), accountLast4: String(int(1000, 9999)), holderName: s.owner.name }
        : { type: "upi", upiId: `${s.slug.replace(/-/g, "")}@okaxis`, holderName: s.owner.name },
      featured: !!s.featured,
      verified: !!s.verified,
      followerCount: int(120, 4800),
      createdAt: daysAgo(int(180, 650)),
    });

    const code = s.name.replace(/[^A-Z]/g, "").slice(0, 3);
    s.products.forEach((p, pi) => {
      const productId = crypto.randomUUID();
      const options = p.options ?? [];
      const combos = cartesian(options);
      const big = p.price > 15000;
      let minPrice = Infinity;
      combos.forEach((attrs, vi) => {
        const mod = Object.entries(attrs).reduce((sum, [k, v]) => sum + (p.priceMods?.[`${k}:${v}`] ?? 0), 0);
        const price = Math.round((p.price + mod) * 100);
        minPrice = Math.min(minPrice, price);
        const stockRoll = rand();
        const stock = stockRoll < 0.07 ? 0 : stockRoll < 0.2 ? int(1, 4) : big ? int(4, 14) : int(8, 72);
        const suffix = Object.values(attrs).map((v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase()).join("-");
        let sku = `${code}-${String(pi + 1).padStart(3, "0")}${suffix ? `-${suffix}` : ""}`;
        if (skus.has(sku)) sku = `${sku}${vi}`;
        skus.add(sku);
        variantRows.push({
          id: crypto.randomUUID(),
          productId,
          sku,
          attributes: attrs,
          price,
          compareAtPrice: p.compareAt ? Math.round((p.compareAt + mod) * 100) : null,
          stock,
          lowStockThreshold: big ? 3 : 5,
          position: vi,
        });
      });
      const created = daysAgo(int(5, 160));
      productRows.push({
        id: productId,
        storeId,
        categoryId: catIds.get(p.category)!,
        slug: slugify(p.title),
        title: p.title,
        summary: p.summary,
        description: `${p.summary}\n\nMade by ${s.name} in ${s.location}. ${s.tagline} Each piece is inspected before it leaves the studio, and ships with care instructions so it lasts for years.\n\nIf you have any questions about sizing, materials or lead times, send the shop a message — they typically reply within a few hours.`,
        specs: (p.specs ?? []).map(([label, value]) => ({ label, value })),
        options,
        tags: p.tags ?? [],
        price: minPrice,
        compareAtPrice: p.compareAt ? Math.round(p.compareAt * 100) : null,
        featured: !!p.featured,
        viewCount: int(300, 9000),
        status: "active",
        createdAt: created,
        updatedAt: created,
      });
      p.images.forEach((key, ii) =>
        imageRows.push({ productId, url: img(key, 1200, 1200), alt: `${p.title}${ii ? ` — view ${ii + 1}` : ""}`, position: ii }),
      );
    });

    const freeOver = [99900, 149900, 49900, 69900, 79900][si % 5]!;
    rateRows.push(
      { storeId, zone: "Domestic", regions: ["IN"], name: "Standard", carrier: pick(["Delhivery", "Ekart", "DTDC", "India Post"]), price: 7900, freeOver, minDays: 3, maxDays: 6 },
      { storeId, zone: "Domestic", regions: ["IN"], name: "Express", carrier: "Blue Dart", price: 14900, freeOver: null, minDays: 1, maxDays: 2 },
    );
    if (si % 3 === 0) {
      rateRows.push({ storeId, zone: "International", regions: ["AE", "SG", "GB", "US"], name: "International Tracked", carrier: "DHL", price: 199900, freeOver: null, minDays: 6, maxDays: 12 });
    }
  });

  const draftId = crypto.randomUUID();
  productRows.push({
    id: draftId, storeId: storeRows[0]!.id, categoryId: catIds.get("ceramics-tableware")!, slug: "speckled-serving-bowl",
    title: "Speckled Serving Bowl", summary: "A wide, shallow serving bowl for salads, biryani and pasta — coming this Diwali.",
    description: "A wide, shallow serving bowl for salads, biryani and pasta. Currently in test firings.", specs: [{ label: "Diameter", value: "28 cm" }],
    options: [], tags: ["handmade"], price: 229900, status: "draft", viewCount: 0, createdAt: daysAgo(2), updatedAt: daysAgo(2),
  });
  imageRows.push({ productId: draftId, url: img("cupsStoneware", 1200, 1200), alt: "Speckled Serving Bowl", position: 0 });
  variantRows.push({ id: crypto.randomUUID(), productId: draftId, sku: "MS-DRAFT-001", attributes: {}, price: 229900, stock: 0, lowStockThreshold: 3, position: 0 });

  await insertChunked(schema.stores, storeRows);
  await insertChunked(schema.products, productRows);
  await insertChunked(schema.productImages, imageRows);
  await insertChunked(schema.productVariants, variantRows);
  await insertChunked(schema.shippingRates, rateRows);

  const productsByStore = new Map<string, ProductRow[]>();
  for (const p of productRows) {
    if (p.status !== "active") continue;
    productsByStore.set(p.storeId, [...(productsByStore.get(p.storeId) ?? []), p]);
  }
  const variantsByProduct = new Map<string, VariantRow[]>();
  for (const v of variantRows) variantsByProduct.set(v.productId, [...(variantsByProduct.get(v.productId) ?? []), v]);
  const firstImage = new Map<string, string>();
  for (const i of imageRows) if (i.position === 0) firstImage.set(i.productId, i.url);

  console.log("› addresses & payment methods");
  type AddressSnap = { fullName: string; line1: string; line2: string | null; city: string; region: string; postalCode: string; country: string; phone: string };
  const addressRows: (typeof schema.addresses.$inferInsert)[] = [];
  const addressFor = new Map<string, AddressSnap>();
  CUSTOMERS.forEach((c, i) => {
    const a: AddressSnap = { fullName: c.name, ...c.address, country: "IN" };
    addressFor.set(customerIds[i]!, a);
    addressRows.push({ userId: customerIds[i]!, label: "Home", ...a, isDefault: true });
  });
  addressRows.push({
    userId: demoCustomerId, label: "Work", fullName: "Rishi Chaurasia", line1: "Embassy TechVillage, Block D, 6th Floor", line2: "Outer Ring Road, Devarabisanahalli",
    city: "Bengaluru", region: "Karnataka", postalCode: "560103", country: "IN", phone: "+91 98450 12345", isDefault: false,
  });
  await insertChunked(schema.addresses, addressRows);

  await insertChunked(schema.paymentMethods, [
    { userId: demoCustomerId, type: "wallet", brand: "upi", email: "rishi.chaurasia@okicici", gatewayToken: "wal_mock_upi_seed", isDefault: true },
    { userId: demoCustomerId, type: "card", brand: "visa", last4: "4242", expMonth: 8, expYear: 2029, holderName: "Rishi Chaurasia", gatewayToken: "tok_mock_4242_seed", isDefault: false },
    { userId: demoCustomerId, type: "card", brand: "rupay", last4: "1110", expMonth: 2, expYear: 2028, holderName: "Rishi Chaurasia", gatewayToken: "tok_mock_1110_seed", isDefault: false },
  ]);

  console.log("› orders");
  const orderRows: (typeof schema.orders.$inferInsert)[] = [];
  const storeOrderRows: (typeof schema.storeOrders.$inferInsert & { id: string; createdAt: Date })[] = [];
  const itemRows: (typeof schema.orderItems.$inferInsert)[] = [];
  const eventRows: (typeof schema.orderEvents.$inferInsert)[] = [];
  const purchases: { userId: string; productId: string; storeId: string; variantLabel: string | null; at: Date; delivered: boolean }[] = [];
  const productSales = new Map<string, number>();
  const storeSales = new Map<string, number>();
  const demoStoreId = storeRows[0]!.id;
  let orderNo = 104200;

  function statusForAge(ageDays: number): FulfillmentStatus {
    if (ageDays > 12) return chance(0.04) ? "cancelled" : "delivered";
    if (ageDays > 7) return weighted([["delivered", 7], ["out_for_delivery", 1], ["shipped", 1]]);
    if (ageDays > 4) return weighted([["shipped", 5], ["out_for_delivery", 2], ["delivered", 2], ["packed", 1]]);
    if (ageDays > 1.5) return weighted([["packed", 3], ["confirmed", 3], ["shipped", 2]]);
    return weighted([["placed", 3], ["confirmed", 2]]);
  }

  function makeOrder(userId: string, ageDays: number, forcedStores?: string[], forcedStatus?: FulfillmentStatus) {
    const created = new Date(NOW - ageDays * DAY - int(0, 6) * 3600_000);
    const storeIds =
      forcedStores ??
      (() => {
        const n = weighted([[1, 6], [2, 3], [3, 1]]);
        const set = new Set<string>();
        if (chance(0.38)) set.add(demoStoreId);
        while (set.size < n) set.add(pick(storeRows).id);
        return [...set];
      })();
    const orderId = crypto.randomUUID();
    let subtotal = 0;
    let shipping = 0;
    const address = addressFor.get(userId)!;
    for (const storeId of storeIds) {
      const products = sample(productsByStore.get(storeId)!, weighted([[1, 6], [2, 3], [3, 1]]));
      const soId = crypto.randomUUID();
      let soSubtotal = 0;
      for (const p of products) {
        const variant = pick(variantsByProduct.get(p.id)!);
        const qty = p.price > 1_000_000 ? 1 : weighted([[1, 7], [2, 2], [3, 1]]);
        const label = Object.values(variant.attributes ?? {}).join(" / ") || null;
        itemRows.push({
          orderId, storeOrderId: soId, productId: p.id, variantId: variant.id, title: p.title, variantLabel: label,
          sku: variant.sku, image: firstImage.get(p.id), unitPrice: variant.price, quantity: qty,
        });
        soSubtotal += variant.price * qty;
        productSales.set(p.id, (productSales.get(p.id) ?? 0) + qty);
        purchases.push({ userId, productId: p.id, storeId, variantLabel: label, at: created, delivered: false });
      }
      const rates = rateRows.filter((r) => r.storeId === storeId);
      const express = chance(0.18);
      const rate = express ? rates.find((r) => r.name === "Express")! : rates.find((r) => r.name === "Standard")!;
      const shipCost = rate.freeOver != null && soSubtotal >= rate.freeOver ? 0 : rate.price;
      const status = forcedStatus ?? statusForAge(ageDays);
      const shipped = FULFILLMENT_FLOW.indexOf(status) >= FULFILLMENT_FLOW.indexOf("shipped");
      storeOrderRows.push({
        id: soId, orderId, storeId, status, subtotal: soSubtotal, shippingCost: shipCost, shippingMethod: rate.name,
        carrier: shipped ? rate.carrier : null, trackingNumber: shipped ? generateTrackingNumber(rate.carrier) : null,
        estimatedDelivery: estimateDelivery(created, rate.maxDays + 1), createdAt: created, updatedAt: created,
      });
      if (status === "delivered") purchases.filter((pu) => pu.at === created && pu.storeId === storeId).forEach((pu) => (pu.delivered = true));
      if (status !== "cancelled") storeSales.set(storeId, (storeSales.get(storeId) ?? 0) + 1);

      const flow = status === "cancelled" ? (["placed", "cancelled"] as FulfillmentStatus[]) : FULFILLMENT_FLOW.slice(0, FULFILLMENT_FLOW.indexOf(status) + 1);
      const span = Math.max(ageDays * DAY - 3600_000, 3600_000);
      flow.forEach((st, i) => {
        const t = i === 0 ? created : new Date(created.getTime() + (span * i) / flow.length + int(0, 3) * 3600_000);
        eventRows.push({
          storeOrderId: soId, status: st, createdAt: t,
          note: st === "cancelled" ? "Cancelled at customer’s request. Refund issued to original payment method." : null,
          location: st === "shipped" || st === "out_for_delivery" ? pick(CARRIER_HUBS) : st === "delivered" ? `${address.city}, ${address.region}` : null,
        });
      });
      subtotal += soSubtotal;
      shipping += shipCost;
    }
    const promo = chance(0.12) ? { code: "WELCOME10", description: "", type: "percent" as const, value: 10, minSubtotal: 0 } : null;
    const totals = computeTotals({ subtotal, shipping, promo });
    const upiHandle = `${users.find((u) => u.id === userId)!.name.split(" ")[0]!.toLowerCase()}@${pick(["okicici", "okhdfcbank", "oksbi", "ybl", "paytm"])}`;
    const pay = weighted<{ type: "card" | "wallet" | "cod"; brand: string; last4?: string; label: string }>([
      [{ type: "wallet", brand: "upi", label: `UPI · ${upiHandle}` }, 9],
      [{ type: "card", brand: "visa", last4: "4242", label: "Visa •••• 4242" }, 3],
      [{ type: "card", brand: "rupay", last4: "1110", label: "RuPay •••• 1110" }, 2],
      [{ type: "card", brand: "mastercard", last4: "4444", label: "Mastercard •••• 4444" }, 2],
      [{ type: "wallet", brand: "netbanking", label: `Net banking · ${pick(["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank"])}` }, 1],
      [{ type: "cod", brand: "cod", label: "Cash on delivery" }, 3],
    ]);
    const allCancelled = storeOrderRows.filter((s) => s.orderId === orderId).every((s) => s.status === "cancelled");
    orderRows.push({
      id: orderId, number: `VNK-${orderNo++}`, userId, email: users.find((u) => u.id === userId)!.email,
      subtotal: totals.subtotal, shippingTotal: totals.shipping, taxTotal: totals.tax, discountTotal: totals.discount, total: totals.total,
      promoCode: promo?.code ?? null, shippingAddress: address, payment: pay,
      paymentStatus: allCancelled ? "refunded" : pay.type === "cod" && !storeOrderRows.filter((s) => s.orderId === orderId).every((s) => s.status === "delivered") ? "pending" : "paid",
      gatewayChargeId: `ch_mock_${crypto.randomUUID().slice(0, 12)}`, createdAt: created,
    });
  }

  for (let i = 0; i < 300; i++) {
    const age = Math.floor(Math.pow(rand(), 1.35) * 120 * 100) / 100;
    makeOrder(pick(customerIds.slice(1)), age);
  }
  const storeBySlug = (slug: string) => storeRows.find((s) => s.slug === slug)!.id;
  makeOrder(demoCustomerId, 0.2, [storeBySlug("mitti-studio"), storeBySlug("dhvani-audio")], "placed");
  makeOrder(demoCustomerId, 3.2, [storeBySlug("khadi-and-co")], "shipped");
  makeOrder(demoCustomerId, 5.5, [storeBySlug("kesar-botanicals"), storeBySlug("hara-bhara-plants")], "out_for_delivery");
  makeOrder(demoCustomerId, 18, [storeBySlug("mitti-studio")], "delivered");
  makeOrder(demoCustomerId, 34, [storeBySlug("chamda-leather-works"), storeBySlug("baba-budan-roasters")], "delivered");
  makeOrder(demoCustomerId, 61, [storeBySlug("sole-street")], "delivered");
  makeOrder(demoCustomerId, 88, [storeBySlug("sheesham-house")], "cancelled");
  for (const age of [0.05, 0.3, 0.8, 1.2]) makeOrder(pick(customerIds.slice(1)), age, [demoStoreId], age < 0.5 ? "placed" : "confirmed");

  await insertChunked(schema.orders, orderRows);
  await insertChunked(schema.storeOrders, storeOrderRows);
  await insertChunked(schema.orderItems, itemRows);
  await insertChunked(schema.orderEvents, eventRows);

  console.log("› reviews");
  const reviewRows: (typeof schema.reviews.$inferInsert)[] = [];
  const reviewed = new Set<string>();
  const addReview = (userId: string, productId: string, storeId: string, variantLabel: string | null, at: Date, verified: boolean) => {
    const key = `${userId}:${productId}`;
    if (reviewed.has(key)) return;
    reviewed.add(key);
    const rating = weighted<1 | 2 | 3 | 4 | 5>([[5, 56], [4, 27], [3, 10], [2, 4], [1, 3]]);
    const t = pick(REVIEW_BANK[rating]);
    const respond = chance(rating <= 3 ? 0.75 : 0.3);
    const created = new Date(at.getTime() + int(4, 12) * DAY);
    if (created.getTime() > NOW) return;
    reviewRows.push({
      productId, storeId, userId, rating, title: t.title, body: t.body, variantLabel, verifiedPurchase: verified,
      helpfulCount: chance(0.5) ? int(1, 28) : 0, createdAt: created,
      vendorResponse: respond ? (rating <= 3 ? pick(VENDOR_RESPONSES.slice(2)) : pick(VENDOR_RESPONSES)) : null,
      respondedAt: respond ? new Date(Math.min(NOW, created.getTime() + int(1, 3) * DAY)) : null,
    });
  };
  for (const pu of purchases) if (pu.delivered && chance(0.45)) addReview(pu.userId, pu.productId, pu.storeId, pu.variantLabel, pu.at, true);
  for (const p of productRows) {
    if (p.status !== "active") continue;
    const extra = int(2, 9);
    for (let i = 0; i < extra; i++) addReview(pick(reviewerPool), p.id, p.storeId, null, daysAgo(int(20, 300)), chance(0.7));
  }
  purchases.filter((pu) => pu.userId === demoCustomerId && pu.delivered).slice(0, 3)
    .forEach((pu) => addReview(pu.userId, pu.productId, pu.storeId, pu.variantLabel, pu.at, true));
  await insertChunked(schema.reviews, reviewRows);

  await db.run(sql`UPDATE products SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviews.product_id = products.id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE reviews.product_id = products.id)`);
  await db.run(sql`UPDATE stores SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviews.store_id = stores.id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE reviews.store_id = stores.id)`);
  for (const [productId, n] of productSales) {
    await db.run(sql`UPDATE products SET sales_count = ${n * 3 + int(0, 40)} WHERE id = ${productId}`);
  }
  for (const [storeId, n] of storeSales) {
    await db.run(sql`UPDATE stores SET sales_count = ${n * 4 + int(100, 900)} WHERE id = ${storeId}`);
  }

  console.log("› analytics & payouts");
  const statRows: (typeof schema.storeDailyStats.$inferInsert)[] = [];
  storeRows.forEach((s, si) => {
    const base = si === 0 ? 210 : int(60, 180);
    for (let d = 119; d >= 0; d--) {
      const date = daysAgo(d);
      const weekday = date.getUTCDay();
      const trend = 0.7 + ((119 - d) / 119) * 0.55;
      const weekend = weekday === 0 || weekday === 6 ? 1.18 : 1;
      const visits = Math.round(base * trend * weekend * (0.82 + rand() * 0.36));
      const search = Math.round(visits * (0.34 + rand() * 0.06));
      const social = Math.round(visits * (0.18 + rand() * 0.06));
      const referral = Math.round(visits * (0.1 + rand() * 0.04));
      statRows.push({
        storeId: s.id, date: date.toISOString().slice(0, 10), visits, productViews: Math.round(visits * (2.1 + rand() * 0.6)),
        sources: { direct: visits - search - social - referral, search, social, referral },
      });
    }
  });
  await insertChunked(schema.storeDailyStats, statRows, 200);

  const payoutRows: (typeof schema.payouts.$inferInsert)[] = [];
  for (const s of storeRows) {
    const method = s.payoutMethod?.type === "upi" ? `UPI · ${s.payoutMethod.upiId}` : `Bank •••• ${s.payoutMethod && "accountLast4" in s.payoutMethod ? s.payoutMethod.accountLast4 : "0000"}`;
    for (let k = 8; k >= 0; k--) {
      const end = daysAgo(k * 14);
      const start = daysAgo(k * 14 + 14);
      const gross = storeOrderRows
        .filter((so) => so.storeId === s.id && so.status !== "cancelled" && so.createdAt >= start && so.createdAt < end)
        .reduce((sum, so) => sum + so.subtotal + so.shippingCost, 0);
      if (gross === 0) continue;
      const fees = Math.round(gross * 0.08) + 1000;
      payoutRows.push({
        storeId: s.id, gross, fees, amount: gross - fees, method, periodStart: start, periodEnd: end,
        status: k === 0 ? "scheduled" : k === 1 ? "in_transit" : "paid",
        paidAt: k >= 2 ? new Date(end.getTime() + 2 * DAY) : null, createdAt: end,
      });
    }
  }
  await insertChunked(schema.payouts, payoutRows);

  console.log("› favorites, follows, cart, notifications");
  const active = productRows.filter((p) => p.status === "active");
  await insertChunked(schema.favorites, sample(active, 8).map((p, i) => ({ userId: demoCustomerId, productId: p.id, createdAt: daysAgo(i * 3 + 1) })));
  const favFill: { userId: string; productId: string }[] = [];
  for (const uid of customerIds.slice(1)) for (const p of sample(active, int(2, 7))) favFill.push({ userId: uid, productId: p.id });
  await insertChunked(schema.favorites, favFill);
  await insertChunked(schema.storeFollows, ["mitti-studio", "kesar-botanicals", "dhvani-audio"].map((slug) => ({ userId: demoCustomerId, storeId: storeBySlug(slug) })));

  const cartId = crypto.randomUUID();
  await db.insert(schema.carts).values({ id: cartId, userId: demoCustomerId });
  const cartPicks = [
    active.find((p) => p.slug === "everyday-stoneware-mug")!,
    active.find((p) => p.slug === "studio-one-wireless-headphones")!,
    active.find((p) => p.slug === "organic-cotton-crew-tee")!,
    active.find((p) => p.slug === "monstera-deliciosa")!,
  ];
  await insertChunked(
    schema.cartItems,
    cartPicks.map((p, i) => {
      const inStock = variantsByProduct.get(p.id)!.filter((v) => v.stock > 3);
      return { cartId, productId: p.id, variantId: (inStock[i % inStock.length] ?? variantsByProduct.get(p.id)![0]!).id, quantity: i === 0 ? 2 : 1, savedForLater: i === 3 };
    }),
  );
  await db.run(sql`UPDATE product_variants SET stock = MAX(stock, 12) WHERE id IN (SELECT variant_id FROM cart_items)`);

  await insertChunked(schema.promoCodes, [
    { code: "WELCOME10", description: "10% off your order", type: "percent", value: 10, minSubtotal: 0 },
    { code: "FREESHIP", description: "Free shipping on orders above ₹499", type: "free_shipping", value: 0, minSubtotal: 49900 },
    { code: "VANIK250", description: "₹250 off orders above ₹2,499", type: "fixed", value: 25000, minSubtotal: 249900 },
    { code: "DIWALI15", description: "15% off festive orders above ₹1,999", type: "percent", value: 15, minSubtotal: 199900 },
  ]);

  const demoOrders = orderRows.filter((o) => o.userId === demoCustomerId).sort((a, b) => +b.createdAt! - +a.createdAt!);
  const notif: (typeof schema.notifications.$inferInsert)[] = [
    { userId: demoCustomerId, type: "order", title: "Order confirmed", body: `We’ve received order ${demoOrders[0]!.number}. We’ll let you know when it ships.`, href: `/account/orders/${demoOrders[0]!.id}`, createdAt: daysAgo(0.2) },
    { userId: demoCustomerId, type: "shipping", title: "Out for delivery", body: `Part of order ${demoOrders[2]!.number} is out for delivery today.`, href: `/account/orders/${demoOrders[2]!.id}`, createdAt: daysAgo(0.6) },
    { userId: demoCustomerId, type: "shipping", title: "Your order has shipped", body: `Khadi & Co. shipped order ${demoOrders[1]!.number} via Delhivery.`, href: `/account/orders/${demoOrders[1]!.id}`, createdAt: daysAgo(2), readAt: daysAgo(1.5) },
    { userId: demoCustomerId, type: "promo", title: "Kesar Botanicals restock", body: "The Everyday Ritual Set you saved is back — and 17% off this week.", href: "/p/everyday-ritual-set", createdAt: daysAgo(3), readAt: daysAgo(2.5) },
    { userId: demoCustomerId, type: "review", title: "How was your order?", body: "Tell other shoppers what you thought of your Mitti Studio purchase.", href: "/account/reviews", createdAt: daysAgo(12), readAt: daysAgo(11) },
    { userId: demoCustomerId, type: "system", title: "Welcome to Vanik", body: "Follow your favorite shops to hear about new drops first.", href: "/stores", createdAt: daysAgo(120), readAt: daysAgo(119) },
  ];
  const shopLow = variantRows.filter((v) => productRows.find((p) => p.id === v.productId)?.storeId === demoStoreId && v.stock > 0 && v.stock <= 4);
  const shopRecent = storeOrderRows.filter((so) => so.storeId === demoStoreId).sort((a, b) => +b.createdAt - +a.createdAt);
  notif.push(
    { userId: demoVendorId, type: "order", title: "New order received", body: `${orderRows.find((o) => o.id === shopRecent[0]!.orderId)!.number} — ready to confirm.`, href: `/vendor/orders/${shopRecent[0]!.id}`, createdAt: new Date(shopRecent[0]!.createdAt) },
    { userId: demoVendorId, type: "order", title: "New order received", body: `${orderRows.find((o) => o.id === shopRecent[1]!.orderId)!.number} — ready to confirm.`, href: `/vendor/orders/${shopRecent[1]!.id}`, createdAt: new Date(shopRecent[1]!.createdAt) },
    ...(shopLow[0] ? [{ userId: demoVendorId, type: "stock" as const, title: "Low stock", body: `${shopLow[0].sku} has only ${shopLow[0].stock} left.`, href: "/vendor/inventory?filter=low", createdAt: daysAgo(1) }] : []),
    { userId: demoVendorId, type: "review", title: "New 5-star review", body: "“Beautiful and well made” on Everyday Stoneware Mug.", href: "/vendor/reviews", createdAt: daysAgo(2) },
    { userId: demoVendorId, type: "payout", title: "Payout on its way", body: "Your latest payout is in transit and should arrive in 1–2 business days.", href: "/vendor/payouts", createdAt: daysAgo(3), readAt: daysAgo(2) },
  );
  await insertChunked(schema.notifications, notif);

  await insertChunked(schema.storeStaff, [
    { storeId: demoStoreId, name: "Priya Raman", email: "vendor@vanik.dev", role: "admin", status: "active" },
    { storeId: demoStoreId, name: "Venkat Subramanian", email: "venkat@mittistudio.example", role: "fulfillment", status: "active" },
    { storeId: demoStoreId, name: "Divya Pillai", email: "divya@mittistudio.example", role: "editor", status: "invited" },
  ]);
  await insertChunked(schema.supportTickets, [
    { storeId: demoStoreId, subject: "Payout arrived a day late", category: "Payouts", body: "Our last NEFT payout landed Thursday instead of Wednesday.", status: "resolved", createdAt: daysAgo(40) },
    { storeId: demoStoreId, subject: "How do I offer local pickup?", category: "Shipping", body: "Some customers in Puducherry and Auroville want to pick up from the studio.", status: "pending", createdAt: daysAgo(6) },
  ]);

  console.log(
    `✓ Seeded ${storeRows.length} stores, ${productRows.length} products, ${variantRows.length} variants, ${orderRows.length} orders, ${reviewRows.length} reviews.`,
  );
  console.log("  Customer: customer@vanik.dev / vanik-demo");
  console.log("  Vendor:   vendor@vanik.dev   / vanik-demo");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
