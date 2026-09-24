import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type Totals = { subtotal: number; shipping: number; shippingDiscount: number; discount: number; tax: number; total: number };

export function SummaryRows({ totals, shippingLabel = "Shipping", itemCount, className }: { totals: Totals; shippingLabel?: string; itemCount?: number; className?: string }) {
  return (
    <dl className={cn("space-y-2.5 text-sm", className)}>
      <div className="flex justify-between">
        <dt className="text-ink-muted">Subtotal{itemCount != null && ` (${itemCount} item${itemCount === 1 ? "" : "s"})`}</dt>
        <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-muted">{shippingLabel}</dt>
        <dd className="tabular-nums">
          {totals.shippingDiscount > 0 && <span className="mr-2 text-ink-subtle line-through">{formatMoney(totals.shippingDiscount)}</span>}
          {totals.shipping === 0 ? <span className="font-medium text-success">Free</span> : formatMoney(totals.shipping)}
        </dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>Discount</dt>
          <dd className="tabular-nums">−{formatMoney(totals.discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t-2 border-line pt-4">
        <dt className="text-base font-semibold">Total</dt>
        <dd className="text-xl font-semibold tabular-nums tracking-tightish">{formatMoney(totals.total)}</dd>
      </div>
      <div className="flex justify-between text-xs text-ink-subtle">
        <dt>Includes GST</dt>
        <dd className="tabular-nums">{formatMoney(totals.tax)}</dd>
      </div>
    </dl>
  );
}
