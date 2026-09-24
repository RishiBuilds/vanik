"use client";

import { useOptimistic, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Bookmark, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeCartItem, toggleSaveForLater, updateCartQuantity } from "@/lib/actions/cart";
import type { CartLine } from "@/lib/queries/cart";
import { cn, formatMoney } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/quantity";
import { ProductImagePlaceholder } from "@/components/shop/product-image";

export function CartLineItem({ line, saved }: { line: CartLine; saved?: boolean }) {
  const [pending, start] = useTransition();
  const [qty, setQty] = useOptimistic(line.quantity);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, success?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Something went wrong");
      else if (res.message) toast(res.message);
      else if (success) toast.success(success);
    });

  const outOfStock = line.stock === 0;
  const limited = !outOfStock && line.stock < line.quantity;

  return (
    <li className={cn("flex gap-4 py-5 transition-opacity sm:gap-5", pending && "opacity-60")}>
      <Link href={`/p/${line.productSlug}`} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28">
        {line.image ? <Image src={line.image} alt={line.title} fill sizes="112px" className="object-cover" /> : <ProductImagePlaceholder title={line.title} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/p/${line.productSlug}`} className="line-clamp-2 text-sm font-medium hover:underline hover:underline-offset-4">
              {line.title}
            </Link>
            {line.variantLabel && <p className="mt-0.5 text-xs text-ink-subtle">{line.variantLabel}</p>}
            <p className="mt-1 text-xs text-ink-subtle tabular-nums">{formatMoney(line.unitPrice)} each</p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(line.unitPrice * qty)}</p>
        </div>
        {(outOfStock || limited) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="size-3.5" />
            {outOfStock ? "Sold out — move it to saved items or remove it." : `Only ${line.stock} left — please lower the quantity.`}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          {saved ? (
            <button
              type="button"
              onClick={() => run(() => toggleSaveForLater(line.id, false), "Moved to cart")}
              disabled={outOfStock}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border-2 border-line-strong px-3 text-xs font-medium hover:border-ink/40 disabled:opacity-50"
            >
              <ShoppingBag className="size-3.5" /> Move to cart
            </button>
          ) : (
            <QuantityStepper
              size="sm"
              value={qty}
              max={Math.max(1, Math.min(line.stock, 99))}
              disabled={outOfStock}
              onChange={(n) =>
                start(async () => {
                  setQty(n);
                  const res = await updateCartQuantity(line.id, n);
                  if (!res.ok) toast.error(res.error);
                  else if (res.message) toast(res.message);
                })
              }
            />
          )}
          <div className="flex items-center gap-1">
            {!saved && (
              <button
                type="button"
                onClick={() => run(() => toggleSaveForLater(line.id, true), "Saved for later")}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-ink-muted hover:bg-muted hover:text-ink"
              >
                <Bookmark className="size-3.5" /> Save for later
              </button>
            )}
            <button
              type="button"
              onClick={() => run(() => removeCartItem(line.id), "Removed from cart")}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-ink-muted hover:bg-danger-soft hover:text-danger"
              aria-label={`Remove ${line.title}`}
            >
              <Trash2 className="size-3.5" /> <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
