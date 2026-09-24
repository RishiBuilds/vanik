import type { Metadata } from "next";
import { requireVendor } from "@/lib/session";
import { getCategoryGroups } from "@/lib/queries/vendor-products";
import { ProductForm } from "@/components/vendor/products/product-form";
import { emptyProductValues } from "@/components/vendor/products/form-values";

export const metadata: Metadata = { title: "Add product · Seller" };

export default async function NewProductPage() {
  const { store } = await requireVendor();
  const categories = await getCategoryGroups();
  const initial = emptyProductValues();
  if (store.categoryId && categories.some((g) => g.children.some((c) => c.id === store.categoryId))) initial.categoryId = store.categoryId;
  return <ProductForm initial={initial} categories={categories} storeName={store.name} />;
}
