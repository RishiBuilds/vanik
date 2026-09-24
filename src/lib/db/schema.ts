import { relations } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export type UserRole = "customer" | "vendor";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").$type<UserRole>().notNull().default("customer"),
  phone: text("phone"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const categories = sqliteTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  parentId: text("parent_id"),
  position: integer("position").notNull().default(0),
});

export type StorePolicies = { shipping: string; returns: string; processingTime: string };
export type PayoutMethod =
  | { type: "bank"; bankName: string; accountLast4: string; holderName: string }
  | { type: "upi"; upiId: string; holderName: string };

export const stores = sqliteTable(
  "stores",
  {
    id: id(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    logo: text("logo"),
    banner: text("banner"),
    brandColor: text("brand_color").notNull().default("#a8461f"),
    categoryId: text("category_id").references(() => categories.id),
    location: text("location").notNull().default(""),
    policies: text("policies", { mode: "json" })
      .$type<StorePolicies>()
      .notNull()
      .default({ shipping: "", returns: "", processingTime: "1–2 working days" }),
    payoutMethod: text("payout_method", { mode: "json" }).$type<PayoutMethod | null>(),
    supportEmail: text("support_email"),
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    followerCount: integer("follower_count").notNull().default(0),
    salesCount: integer("sales_count").notNull().default(0),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    status: text("status").$type<"active" | "paused">().notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("stores_owner_idx").on(t.ownerId)],
);

export const storeStaff = sqliteTable("store_staff", {
  id: id(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<"admin" | "editor" | "fulfillment">().notNull().default("editor"),
  status: text("status").$type<"active" | "invited">().notNull().default("invited"),
  createdAt: createdAt(),
});

export type ProductOption = { name: string; values: string[] };
export type ProductSpec = { label: string; value: string };
export type ProductStatus = "active" | "draft" | "archived";

export const products = sqliteTable(
  "products",
  {
    id: id(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    specs: text("specs", { mode: "json" }).$type<ProductSpec[]>().notNull().default([]),
    options: text("options", { mode: "json" }).$type<ProductOption[]>().notNull().default([]),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    salesCount: integer("sales_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    status: text("status").$type<ProductStatus>().notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_store_idx").on(t.storeId),
    index("products_category_idx").on(t.categoryId),
    index("products_price_idx").on(t.price),
  ],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: id(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: id(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    attributes: text("attributes", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: id(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    variantLabel: text("variant_label"),
    helpfulCount: integer("helpful_count").notNull().default(0),
    verifiedPurchase: integer("verified_purchase", { mode: "boolean" }).notNull().default(true),
    vendorResponse: text("vendor_response"),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_product_idx").on(t.productId), index("reviews_store_idx").on(t.storeId)],
);

export const addresses = sqliteTable("addresses", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  fullName: text("full_name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  region: text("region").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("IN"),
  phone: text("phone"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export type PaymentMethodType = "card" | "wallet";

export const paymentMethods = sqliteTable("payment_methods", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").$type<PaymentMethodType>().notNull(),
  brand: text("brand").notNull(),
  last4: text("last4"),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  holderName: text("holder_name"),
  email: text("email"),
  gatewayToken: text("gateway_token").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const storeFollows = sqliteTable(
  "store_follows",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.storeId] })],
);

export const carts = sqliteTable("carts", {
  id: id(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  promoCode: text("promo_code"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: id(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    savedForLater: integer("saved_for_later", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("cart_items_cart_idx").on(t.cartId)],
);

export const promoCodes = sqliteTable("promo_codes", {
  code: text("code").primaryKey(),
  description: text("description").notNull(),
  type: text("type").$type<"percent" | "fixed" | "free_shipping">().notNull(),
  value: integer("value").notNull().default(0),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export type AddressSnapshot = {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string | null;
};

export type PaymentSnapshot = {
  type: "card" | "wallet" | "cod";
  brand: string;
  last4?: string | null;
  label: string;
};

export type FulfillmentStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    number: text("number").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    subtotal: integer("subtotal").notNull(),
    shippingTotal: integer("shipping_total").notNull(),
    taxTotal: integer("tax_total").notNull(),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull(),
    promoCode: text("promo_code"),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<AddressSnapshot>().notNull(),
    payment: text("payment", { mode: "json" }).$type<PaymentSnapshot>().notNull(),
    paymentStatus: text("payment_status").$type<"paid" | "pending" | "refunded">().notNull().default("paid"),
    gatewayChargeId: text("gateway_charge_id"),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_created_idx").on(t.createdAt)],
);

export const storeOrders = sqliteTable(
  "store_orders",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    status: text("status").$type<FulfillmentStatus>().notNull().default("placed"),
    subtotal: integer("subtotal").notNull(),
    shippingCost: integer("shipping_cost").notNull(),
    shippingMethod: text("shipping_method").notNull(),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    estimatedDelivery: integer("estimated_delivery", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("store_orders_store_idx").on(t.storeId), index("store_orders_order_idx").on(t.orderId)],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storeOrderId: text("store_order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    variantLabel: text("variant_label"),
    sku: text("sku"),
    image: text("image"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_store_order_idx").on(t.storeOrderId)],
);

export const orderEvents = sqliteTable(
  "order_events",
  {
    id: id(),
    storeOrderId: text("store_order_id")
      .notNull()
      .references(() => storeOrders.id, { onDelete: "cascade" }),
    status: text("status").$type<FulfillmentStatus>().notNull(),
    note: text("note"),
    location: text("location"),
    createdAt: createdAt(),
  },
  (t) => [index("order_events_so_idx").on(t.storeOrderId)],
);

export const shippingRates = sqliteTable("shipping_rates", {
  id: id(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  zone: text("zone").notNull().default("Domestic"),
  regions: text("regions", { mode: "json" }).$type<string[]>().notNull().default(["IN"]),
  name: text("name").notNull(),
  carrier: text("carrier").notNull(),
  price: integer("price").notNull(),
  freeOver: integer("free_over"),
  minDays: integer("min_days").notNull(),
  maxDays: integer("max_days").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const payouts = sqliteTable("payouts", {
  id: id(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  gross: integer("gross").notNull(),
  fees: integer("fees").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").$type<"paid" | "in_transit" | "scheduled">().notNull(),
  method: text("method").notNull(),
  periodStart: integer("period_start", { mode: "timestamp_ms" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp_ms" }).notNull(),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export type TrafficSources = { direct: number; search: number; social: number; referral: number };

export const storeDailyStats = sqliteTable(
  "store_daily_stats",
  {
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    visits: integer("visits").notNull().default(0),
    productViews: integer("product_views").notNull().default(0),
    sources: text("sources", { mode: "json" })
      .$type<TrafficSources>()
      .notNull()
      .default({ direct: 0, search: 0, social: 0, referral: 0 }),
  },
  (t) => [primaryKey({ columns: [t.storeId, t.date] })],
);

export const supportTickets = sqliteTable("support_tickets", {
  id: id(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  body: text("body").notNull(),
  status: text("status").$type<"open" | "pending" | "resolved">().notNull().default("open"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type NotificationType = "order" | "shipping" | "review" | "stock" | "promo" | "payout" | "system";

export const notifications = sqliteTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export type NotificationChannelPrefs = { inApp: boolean; email: boolean };
export type NotificationPrefsMap = {
  orderUpdates: NotificationChannelPrefs;
  promotions: NotificationChannelPrefs;
  reviews: NotificationChannelPrefs;
  stock: NotificationChannelPrefs;
  payouts: NotificationChannelPrefs;
};

export const defaultNotificationPrefs: NotificationPrefsMap = {
  orderUpdates: { inApp: true, email: true },
  promotions: { inApp: true, email: false },
  reviews: { inApp: true, email: true },
  stock: { inApp: true, email: true },
  payouts: { inApp: true, email: true },
};

export const notificationPrefs = sqliteTable("notification_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  prefs: text("prefs", { mode: "json" }).$type<NotificationPrefsMap>().notNull().default(defaultNotificationPrefs),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  createdAt: createdAt(),
});

export const userRelations = relations(user, ({ one, many }) => ({
  store: one(stores, { fields: [user.id], references: [stores.ownerId] }),
  addresses: many(addresses),
  paymentMethods: many(paymentMethods),
  orders: many(orders),
  reviews: many(reviews),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "tree" }),
  children: many(categories, { relationName: "tree" }),
  products: many(products),
}));

export const storeRelations = relations(stores, ({ one, many }) => ({
  owner: one(user, { fields: [stores.ownerId], references: [user.id] }),
  category: one(categories, { fields: [stores.categoryId], references: [categories.id] }),
  products: many(products),
  shippingRates: many(shippingRates),
  staff: many(storeStaff),
  payouts: many(payouts),
}));

export const storeStaffRelations = relations(storeStaff, ({ one }) => ({
  store: one(stores, { fields: [storeStaff.storeId], references: [stores.id] }),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const productImageRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const variantRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  store: one(stores, { fields: [reviews.storeId], references: [stores.id] }),
  user: one(user, { fields: [reviews.userId], references: [user.id] }),
}));

export const addressRelations = relations(addresses, ({ one }) => ({
  user: one(user, { fields: [addresses.userId], references: [user.id] }),
}));

export const paymentMethodRelations = relations(paymentMethods, ({ one }) => ({
  user: one(user, { fields: [paymentMethods.userId], references: [user.id] }),
}));

export const favoriteRelations = relations(favorites, ({ one }) => ({
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
  user: one(user, { fields: [favorites.userId], references: [user.id] }),
}));

export const storeFollowRelations = relations(storeFollows, ({ one }) => ({
  store: one(stores, { fields: [storeFollows.storeId], references: [stores.id] }),
  user: one(user, { fields: [storeFollows.userId], references: [user.id] }),
}));

export const cartRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  storeOrders: many(storeOrders),
  items: many(orderItems),
}));

export const storeOrderRelations = relations(storeOrders, ({ one, many }) => ({
  order: one(orders, { fields: [storeOrders.orderId], references: [orders.id] }),
  store: one(stores, { fields: [storeOrders.storeId], references: [stores.id] }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  storeOrder: one(storeOrders, { fields: [orderItems.storeOrderId], references: [storeOrders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderEventRelations = relations(orderEvents, ({ one }) => ({
  storeOrder: one(storeOrders, { fields: [orderEvents.storeOrderId], references: [storeOrders.id] }),
}));

export const shippingRateRelations = relations(shippingRates, ({ one }) => ({
  store: one(stores, { fields: [shippingRates.storeId], references: [stores.id] }),
}));

export const payoutRelations = relations(payouts, ({ one }) => ({
  store: one(stores, { fields: [payouts.storeId], references: [stores.id] }),
}));

export const supportTicketRelations = relations(supportTickets, ({ one }) => ({
  store: one(stores, { fields: [supportTickets.storeId], references: [stores.id] }),
}));
