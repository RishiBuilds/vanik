import type { VendorProductDetail } from "@/lib/queries/vendor-products";
import type { ProductFormValues } from "./product-form";
import { centsToInput } from "./shared";

export function emptyProductValues(): ProductFormValues {
  return {
    title: "",
    summary: "",
    description: "",
    categoryId: "",
    status: "draft",
    tags: [],
    specs: [],
    options: [],
    images: [],
    variants: [{ attributes: {}, sku: "", price: "", compareAtPrice: "", stock: "0", lowStockThreshold: "5" }],
  };
}

export function productToValues(p: VendorProductDetail): ProductFormValues {
  const variants = p.variants.length
    ? p.variants.map((v) => ({
        id: v.id,
        attributes: v.attributes,
        sku: v.sku,
        price: centsToInput(v.price),
        compareAtPrice: centsToInput(v.compareAtPrice),
        stock: String(v.stock),
        lowStockThreshold: String(v.lowStockThreshold),
      }))
    : emptyProductValues().variants;
  return {
    title: p.title,
    summary: p.summary,
    description: p.description,
    categoryId: p.categoryId,
    status: p.status,
    tags: p.tags,
    specs: p.specs.map((s, i) => ({ key: `spec-${i}`, label: s.label, value: s.value })),
    options: p.options.map((o, i) => ({ key: `opt-${i}`, name: o.name, values: o.values })),
    images: p.images.map((img) => ({ key: img.id, url: img.url, alt: img.alt })),
    variants,
  };
}
