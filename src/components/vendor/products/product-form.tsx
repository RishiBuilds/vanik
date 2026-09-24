"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteProducts, duplicateProduct, saveProduct, type ProductInput } from "@/lib/actions/vendor-products";
import type { CategoryGroup } from "@/lib/queries/vendor-products";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { ProductImagePlaceholder } from "@/components/shop/product-image";
import { PageHeader } from "@/components/account/page-header";
import { ChipInput } from "./chip-input";
import { ConfirmDialog } from "./confirm-dialog";
import { MediaManager, type FormImage } from "./media-manager";
import { STATUS_LABEL, STATUS_TONE, inputToCents, isOptimizable, type ProductStatusValue } from "./shared";
import {
  OptionBuilder,
  SingleVariantFields,
  VariantMatrix,
  comboKey,
  matrixOptions,
  syncVariants,
  type FormOption,
  type FormVariant,
} from "./variant-editor";

export type FormSpec = { key: string; label: string; value: string };
export type ProductFormValues = {
  title: string;
  summary: string;
  description: string;
  categoryId: string;
  status: ProductStatusValue;
  tags: string[];
  specs: FormSpec[];
  options: FormOption[];
  images: FormImage[];
  variants: FormVariant[];
};

type Errors = Record<string, string[] | undefined>;

const STATUS_HINT: Record<ProductStatusValue, string> = {
  active: "Visible in your store and search.",
  draft: "Hidden from shoppers while you work on it.",
  archived: "Hidden and removed from inventory counts.",
};

export function ProductForm({
  productId,
  slug,
  savedStatus,
  initial,
  categories,
  storeName,
}: {
  productId?: string;
  slug?: string;
  savedStatus?: ProductStatusValue;
  initial: ProductFormValues;
  categories: CategoryGroup[];
  storeName: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const [busy, startBusy] = useTransition();
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const memory = useRef(new Map<string, FormVariant>());
  const isNew = !productId;

  const dirty = useMemo(() => JSON.stringify(values) !== baseline, [values, baseline]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    for (const v of values.variants) memory.current.set(comboKey(v.attributes), v);
  }, [values.variants]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const setOptions = (options: FormOption[]) =>
    setValues((v) => ({ ...v, options, variants: syncVariants(options, v.variants, memory.current) }));

  const hasMatrix = matrixOptions(values.options).length > 0;
  const err = (k: string) => errors[k];

  const prices = values.variants.map((v) => inputToCents(v.price)).filter((n): n is number => n != null);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const cheapest = values.variants.find((v) => inputToCents(v.price) === minPrice);
  const compareAt = cheapest ? inputToCents(cheapest.compareAtPrice) : null;
  const totalStock = values.variants.reduce((n, v) => n + (Number(v.stock) || 0), 0);
  const categoryName = categories.flatMap((g) => g.children.map((c) => ({ ...c, group: g.name }))).find((c) => c.id === values.categoryId);

  const submit = () => {
    setFormError(null);
    const payload: ProductInput = {
      id: productId,
      title: values.title,
      summary: values.summary,
      description: values.description,
      categoryId: values.categoryId,
      status: values.status,
      tags: values.tags,
      specs: values.specs.map(({ label, value }) => ({ label, value })),
      options: values.options
        .filter((o) => o.name.trim() || o.values.length)
        .map((o) => ({ name: o.name.trim(), values: o.values })),
      images: values.images.map(({ url, alt }) => ({ url, alt })),
      variants: values.variants.map((v) => ({ ...v, attributes: remapAttributes(v.attributes, values.options) })),
    };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        setFormError(r.error);
        toast.error(r.error);
        requestAnimationFrame(() => document.querySelector("[aria-invalid=true], [role=alert]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      setErrors({});
      setBaseline(JSON.stringify(values));
      toast.success(r.message ?? "Saved");
      if (isNew) router.replace(`/vendor/products/${r.id}`);
      else router.refresh();
    });
  };

  const doDuplicate = () =>
    startBusy(async () => {
      if (!productId) return;
      const r = await duplicateProduct(productId);
      if (r.ok) {
        toast.success(r.message ?? "Duplicated");
        router.push(`/vendor/products/${r.id}`);
      } else toast.error(r.error);
    });

  const doDelete = () =>
    startBusy(async () => {
      if (!productId) return;
      const r = await deleteProducts([productId]);
      if (r.ok) {
        setBaseline(JSON.stringify(values));
        toast.success(r.message ?? "Deleted");
        router.push("/vendor/products");
      } else {
        toast.error(r.error);
        setConfirmDelete(false);
      }
    });

  const saveLabel = isNew ? (values.status === "active" ? "Publish product" : "Save product") : "Save changes";
  const primaryImage = values.images[0]?.url;

  return (
    <form
      id="product-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          submit();
        }
      }}
    >

      <PageHeader
        eyebrow={
          <Link href="/vendor/products" className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft className="size-3.5" /> Products
          </Link>
        }
        title={isNew ? "Add product" : initial.title || "Edit product"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {savedStatus && (
              <Badge tone={STATUS_TONE[savedStatus]} size="sm" dot>
                {STATUS_LABEL[savedStatus]}
              </Badge>
            )}
            {isNew ? "Photos, pricing and stock — everything shoppers need to buy with confidence." : dirty ? "You have unsaved changes." : "All changes saved."}
          </span>
        }
        actions={
          <>
            {!isNew && savedStatus === "active" && slug && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/p/${slug}`} target="_blank">
                  <ExternalLink /> View in store
                </Link>
              </Button>
            )}
            <Button type="submit" size="sm" loading={pending} disabled={!isNew && !dirty}>
              <Save /> {saveLabel}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <FormError message={formError} />


          <Card>
            <CardHeader title="Basics" description="What it is, in your words." />
            <CardBody className="space-y-5">
              <Field label="Title" error={err("title")}>
                {(f) => (
                  <Input {...f} value={values.title} maxLength={120} placeholder="e.g. Everyday Stoneware Mug" onChange={(e) => set("title", e.target.value)} />
                )}
              </Field>
              <Field label="Summary" optional hint={`${values.summary.length}/200 · One line shown under the title`} error={err("summary")}>
                {(f) => (
                  <Input {...f} value={values.summary} maxLength={200} placeholder="Wheel-thrown, dishwasher-safe, holds 12 oz." onChange={(e) => set("summary", e.target.value)} />
                )}
              </Field>
              <Field label="Description" optional hint="Materials, dimensions, care — blank lines start a new paragraph." error={err("description")}>
                {(f) => (
                  <Textarea {...f} rows={7} value={values.description} maxLength={8000} onChange={(e) => set("description", e.target.value)} />
                )}
              </Field>
              <Field label="Category" error={err("categoryId")}>
                {(f) => (
                  <Select {...f} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {categories.map((g) => (
                      <optgroup key={g.id} label={g.name}>
                        {g.children.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                )}
              </Field>
            </CardBody>
          </Card>


          <Card>
            <CardHeader title="Media" description="Bright, natural-light photos sell best. Square works everywhere." />
            <CardBody>
              <MediaManager
                images={values.images}
                onChange={(fn) => setValues((v) => ({ ...v, images: fn(v.images) }))}
                error={err("images")?.[0]}
                title={values.title}
              />
            </CardBody>
          </Card>


          <Card>
            <CardHeader
              title="Options & variants"
              description={hasMatrix ? `${values.variants.length} variant${values.variants.length === 1 ? "" : "s"} — each has its own SKU, price and stock.` : "Pricing and stock for this product."}
            />
            <CardBody className="space-y-6">
              <OptionBuilder options={values.options} onChange={setOptions} errors={errors} />
              <div className="border-t-2 border-line pt-6">
                {hasMatrix ? (
                  <VariantMatrix options={values.options} variants={values.variants} onChange={(v) => set("variants", v)} errors={errors} />
                ) : (
                  <SingleVariantFields variant={values.variants[0]!} onChange={(v) => set("variants", [v])} errors={errors} />
                )}
              </div>
            </CardBody>
          </Card>


          <Card>
            <CardHeader title="Specifications" description="Quick facts shown in a table on the product page." />
            <CardBody className="space-y-3">
              {values.specs.length === 0 && <p className="text-sm text-ink-muted">Add details like material, dimensions or care instructions.</p>}
              {values.specs.map((s, i) => (
                <div key={s.key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-start gap-2 sm:gap-3">
                  <div>
                    <Input
                      aria-label={`Specification ${i + 1} label`}
                      aria-invalid={err(`specs.${i}.label`) ? true : undefined}
                      placeholder="Material"
                      value={s.label}
                      maxLength={40}
                      onChange={(e) => set("specs", values.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    />
                    {err(`specs.${i}.label`) && <p className="mt-1 text-xs text-danger">{err(`specs.${i}.label`)![0]}</p>}
                  </div>
                  <div>
                    <Input
                      aria-label={`Specification ${i + 1} value`}
                      aria-invalid={err(`specs.${i}.value`) ? true : undefined}
                      placeholder="Stoneware"
                      value={s.value}
                      maxLength={200}
                      onChange={(e) => set("specs", values.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    />
                    {err(`specs.${i}.value`) && <p className="mt-1 text-xs text-danger">{err(`specs.${i}.value`)![0]}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-ink-subtle hover:text-danger"
                    aria-label={`Remove specification ${s.label || i + 1}`}
                    onClick={() => set("specs", values.specs.filter((_, j) => j !== i))}
                  >
                    <X />
                  </Button>
                </div>
              ))}
              {values.specs.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("specs", [...values.specs, { key: crypto.randomUUID(), label: "", value: "" }])}
                >
                  <Plus /> Add specification
                </Button>
              )}
            </CardBody>
          </Card>


          <Card>
            <CardHeader title="Organization" description="Tags help shoppers find this in search." />
            <CardBody>
              <Field label="Tags" optional hint={`${values.tags.length}/15 · Press Enter or comma to add`} error={err("tags")}>
                {(f) => (
                  <ChipInput
                    id={f.id}
                    invalid={f["aria-invalid"]}
                    describedBy={f["aria-describedby"]}
                    values={values.tags}
                    onChange={(tags) => set("tags", tags)}
                    max={15}
                    maxLength={32}
                    normalize={(s) => s.toLowerCase()}
                    placeholder="handmade, gift, ceramic"
                  />
                )}
              </Field>
            </CardBody>
          </Card>
        </div>


        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Status" />
            <CardBody className="space-y-4">
              <Field label="Visibility" hint={STATUS_HINT[values.status]} error={err("status")}>
                {(f) => (
                  <Select {...f} value={values.status} onChange={(e) => set("status", e.target.value as ProductStatusValue)}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Select>
                )}
              </Field>
              <Button type="submit" block loading={pending} disabled={!isNew && !dirty}>
                <Save /> {saveLabel}
              </Button>
              {!isNew && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-line pt-4">
                  <Button type="button" variant="ghost" size="xs" onClick={doDuplicate} loading={busy && !confirmDelete}>
                    <Copy /> Duplicate
                  </Button>
                  <Button type="button" variant="danger-ghost" size="xs" onClick={() => setConfirmDelete(true)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Preview"
              action={
                !isNew && savedStatus === "active" && slug ? (
                  <Link href={`/p/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink">
                    View in store <ExternalLink className="size-3.5" />
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              <div className="overflow-hidden rounded-lg border-2 border-line">
                <div className="relative aspect-square bg-muted">
                  {primaryImage ? (
                    <Image src={primaryImage} alt="" fill sizes="22rem" className="object-cover" unoptimized={!isOptimizable(primaryImage)} />
                  ) : (
                    <ProductImagePlaceholder title={values.title || "Your product"} />
                  )}
                  {compareAt != null && minPrice != null && compareAt > minPrice && (
                    <span className="absolute left-2.5 top-2.5">
                      <Badge tone="accent" size="sm">
                        Sale
                      </Badge>
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3.5">
                  <p className="text-xs text-ink-subtle">{storeName}</p>
                  <p className={cn("line-clamp-2 text-sm font-medium", !values.title && "text-ink-subtle")}>{values.title || "Product title"}</p>
                  <p className="flex items-baseline gap-2 text-sm">
                    {minPrice == null ? (
                      <span className="text-ink-subtle">Set a price</span>
                    ) : (
                      <>
                        <span className={cn("font-semibold tabular-nums", compareAt != null && compareAt > minPrice && "text-accent")}>
                          {minPrice !== maxPrice ? `From ${formatMoney(minPrice)}` : formatMoney(minPrice)}
                        </span>
                        {compareAt != null && compareAt > minPrice && (
                          <span className="text-xs tabular-nums text-ink-subtle line-through">{formatMoney(compareAt)}</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-ink-subtle">Category</dt>
                  <dd className="mt-0.5 truncate font-medium">{categoryName ? categoryName.name : "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Stock</dt>
                  <dd className={cn("mt-0.5 font-semibold tabular-nums", totalStock <= 0 && "text-danger")}>
                    {totalStock} unit{totalStock === 1 ? "" : "s"}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </aside>
      </div>


      {(dirty || isNew) && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-t-2 border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
          <span className="text-sm text-ink-muted">{isNew ? "New product" : "Unsaved changes"}</span>
          <Button type="submit" size="sm" loading={pending}>
            <Save /> {saveLabel}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${initial.title}”?`}
        description="This permanently removes the listing, its photos and variants, and takes it out of shoppers’ carts. Past orders keep their line items."
        confirmLabel="Delete product"
        pending={busy}
        onConfirm={doDelete}
      />
    </form>
  );
}

function remapAttributes(attrs: Record<string, string>, options: FormOption[]) {
  const out: Record<string, string> = {};
  const opts = matrixOptions(options);
  opts.forEach((o) => {
    const val = attrs[o.name];
    if (val != null) {
      const original = options.find((x) => x.key === o.key);
      out[original?.name.trim() ?? o.name] = val;
    }
  });
  return out;
}
