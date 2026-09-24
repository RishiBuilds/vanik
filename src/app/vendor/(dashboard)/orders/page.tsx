import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { listVendorOrders, ORDER_TABS, type OrderTab } from "@/lib/queries/vendor-orders";
import { cn, firstParam } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/account/page-header";
import { VendorOrdersTable } from "@/components/vendor/orders-table";

export const metadata: Metadata = { title: "Orders · Seller" };

export default async function VendorOrdersPage(props: PageProps<"/vendor/orders">) {
  const { store } = await requireVendor();
  const sp = await props.searchParams;
  const t = firstParam(sp.status);
  const tab: OrderTab = t && t in ORDER_TABS ? (t as OrderTab) : "all";
  const q = firstParam(sp.q) ?? "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);
  const data = await listVendorOrders(store.id, { tab, q, page });

  const tabHref = (k: OrderTab) => {
    const p = new URLSearchParams();
    if (k !== "all") p.set("status", k);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/vendor/orders${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Orders" description="Confirm, pack and ship your part of each customer order." />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Order status" className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {(Object.keys(ORDER_TABS) as OrderTab[]).map((k) => (
            <Link
              key={k}
              href={tabHref(k)}
              aria-current={tab === k ? "true" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm transition-colors",
                tab === k ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
              )}
            >
              {ORDER_TABS[k].label}
              <span className={cn("text-xs tabular-nums", tab === k ? "text-ink-inverse/70" : "text-ink-subtle")}>{data.counts[k]}</span>
            </Link>
          ))}
        </nav>
        <form className="relative w-full lg:w-72" role="search">
          {tab !== "all" && <input type="hidden" name="status" value={tab} />}
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            id="order-q"
            name="q"
            defaultValue={q}
            placeholder="Order number or customer"
            className="h-10 w-full rounded-md border-2 border-line-strong bg-surface pl-9 pr-3 text-sm placeholder:text-ink-subtle focus:border-ink focus:outline-none focus:ring-3 focus:ring-accent/15"
          />
        </form>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={q ? `No orders match “${q}”` : tab === "to_fulfil" ? "You’re all caught up" : "No orders here yet"}
          description={q ? "Try an order number like VNK-104300, or a customer name." : tab === "to_fulfil" ? "New orders that need confirming or packing will show up here." : "Orders will appear as customers check out."}
          action={
            (q || tab !== "all") && (
              <Button asChild variant="outline">
                <Link href="/vendor/orders">View all orders</Link>
              </Button>
            )
          }
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <>
          <VendorOrdersTable rows={data.rows} />
          <Pagination page={page} pageCount={data.pageCount} basePath="/vendor/orders" params={sp} className="mt-8" />
        </>
      )}
    </div>
  );
}
