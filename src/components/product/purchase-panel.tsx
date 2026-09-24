"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/lib/actions/cart";
import { swatch } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/misc";
import { QuantityStepper } from "@/components/ui/quantity";
import { FavoriteButton } from "@/components/shop/favorite-button";

type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
};

const COLOR_OPTIONS = new Set(["Color", "Glaze", "Finish", "Scent"]);

export function PurchasePanel({
  productId,
  title,
  options,
  variants,
  favorited,
}: {
  productId: string;
  title: string;
  options: { name: string; values: string[] }[];
  variants: Variant[];
  favorited: boolean;
}) {
  const router = useRouter();
  const initial = variants.find((v) => v.stock > 0) ?? variants[0]!;
  const [selected, setSelected] = useState<Record<string, string>>(initial.attributes);
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  const variant = useMemo(
    () => variants.find((v) => options.every((o) => v.attributes[o.name] === selected[o.name])) ?? null,
    [variants, options, selected],
  );

  function available(optionName: string, value: string) {
    return variants.some(
      (v) =>
        v.attributes[optionName] === value &&
        v.stock > 0 &&
        options.every((o) => o.name === optionName || v.attributes[o.name] === selected[o.name]),
    );
  }

  const stock = variant?.stock ?? 0;
  const low = variant && stock > 0 && stock <= variant.lowStockThreshold;

  function add() {
    if (!variant) return;
    start(async () => {
      const res = await addToCart({ variantId: variant.id, quantity: qty });
      if (res.ok) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2200);
        toast.success(res.message ?? "Added to cart", { action: { label: "View cart", onClick: () => router.push("/cart") } });
      } else toast.error(res.error);
    });
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <Price cents={variant?.price ?? initial.price} compareAt={variant?.compareAtPrice ?? initial.compareAtPrice} size="lg" />
      </div>
      <p className="mt-1 text-xs text-ink-subtle">Inclusive of all taxes.</p>

      <div className="mt-7 space-y-6">
        {options.map((opt) => {
          const isColor = COLOR_OPTIONS.has(opt.name);
          return (
            <fieldset key={opt.name}>
              <legend className="mb-2.5 text-sm">
                <span className="font-medium">{opt.name}:</span> <span className="text-ink-muted">{selected[opt.name]}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const active = selected[opt.name] === val;
                  const ok = available(opt.name, val);
                  const hex = isColor ? swatch(val) : null;
                  return (
                    <button
                      key={val}
                      type="button"
                      aria-pressed={active}
                      aria-label={`${opt.name} ${val}${ok ? "" : " (sold out)"}`}
                      onClick={() => setSelected((s) => ({ ...s, [opt.name]: val }))}
                      className={cn(
                        "relative inline-flex h-11 items-center gap-2 rounded-md border-2 px-4 text-sm transition-[border-color,box-shadow,background-color]",
                        active ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-line-strong hover:border-ink/40",
                        !ok && "text-ink-subtle",
                        hex && "pl-2",
                      )}
                    >
                      {hex && <span className="size-7 rounded-sm border-2 border-black/10" style={{ background: hex }} />}
                      <span className={cn(!ok && "line-through decoration-ink-subtle")}>{val}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-7 flex items-center gap-2 text-sm" aria-live="polite">
        {!variant ? (
          <span className="text-ink-muted">This combination isn’t available.</span>
        ) : stock === 0 ? (
          <>
            <span className="size-2 rounded-full bg-danger" /> <span className="font-medium text-danger">Sold out</span>
            <span className="text-ink-subtle">— try another option</span>
          </>
        ) : low ? (
          <>
            <span className="size-2 rounded-full bg-warning" /> <span className="font-medium text-warning">Only {stock} left</span>
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-success" /> <span className="text-ink-muted">In stock, ready to ship</span>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(stock, 20))} disabled={!variant || stock === 0} />
        <Button size="md" className="h-11 flex-1" onClick={add} loading={pending} disabled={!variant || stock === 0}>
          {justAdded ? (
            <>
              <Check /> Added
            </>
          ) : (
            <>
              <ShoppingBag /> Add to cart
            </>
          )}
        </Button>
        <FavoriteButton productId={productId} initial={favorited} title={title} variant="outline" className="size-11" />
      </div>
      {variant && <p className="mt-3 font-mono text-2xs text-ink-subtle">SKU {variant.sku}</p>}
    </div>
  );
}
