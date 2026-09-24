import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireVendor } from "@/lib/session";
import { getCategoryGroups, getVendorProduct } from "@/lib/queries/vendor-products";
import { ProductForm } from "@/components/vendor/products/product-form";
import { productToValues } from "@/components/vendor/products/form-values";

export async function generateMetadata(props: PageProps<"/vendor/products/[id]">): Promise<Metadata> {
  const { store } = await requireVendor();
  const product = await getVendorProduct(store.id, (await props.params).id);
  return { title: `${product?.title ?? "Product"} · Seller` };
}

export default async function EditProductPage(props: PageProps<"/vendor/products/[id]">) {
  const { store } = await requireVendor();
  const { id } = await props.params;
  const [product, categories] = await Promise.all([getVendorProduct(store.id, id), getCategoryGroups()]);
  if (!product) notFound();
  return (
    <ProductForm
      key={product.updatedAt.getTime()}
      productId={product.id}
      slug={product.slug}
      savedStatus={product.status}
      initial={productToValues(product)}
      categories={categories}
      storeName={store.name}
    />
  );
}
