
export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const STATUS_LABEL: Record<ProductStatusValue, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

export const STATUS_TONE = { active: "success", draft: "neutral", archived: "warning" } as const;

export const PRODUCT_SORTS = [
  { value: "updated", label: "Last updated" },
  { value: "title", label: "Title A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "stock-asc", label: "Stock: low to high" },
  { value: "stock-desc", label: "Stock: high to low" },
  { value: "sales", label: "Best selling" },
] as const;
export type ProductSortKey = (typeof PRODUCT_SORTS)[number]["value"];

export const INVENTORY_FILTERS = { all: "All SKUs", low: "Low stock", out: "Out of stock" } as const;
export type InventoryFilter = keyof typeof INVENTORY_FILTERS;

export const INVENTORY_SORTS = [
  { value: "stock-asc", label: "Stock: low to high" },
  { value: "stock-desc", label: "Stock: high to low" },
  { value: "title", label: "Product A–Z" },
  { value: "sku", label: "SKU" },
] as const;
export type InventorySortKey = (typeof INVENTORY_SORTS)[number]["value"];

export type StockState = "in" | "low" | "out";
export function stockState(stock: number, threshold: number): StockState {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "in";
}

export function variantLabel(attributes: Record<string, string>) {
  const vals = Object.values(attributes);
  return vals.length ? vals.join(" / ") : "Default";
}

export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  const rupees = cents / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

export function inputToCents(s: string): number | null {
  const clean = s.replace(/[₹,\s]/g, "");
  if (!clean || !/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export function isOptimizable(src: string) {
  return src.startsWith("https://images.unsplash.com/") || src.startsWith("/");
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 12;
export const MAX_OPTIONS = 3;
