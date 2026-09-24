import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOrders } from "@/lib/queries/account";
import { aggregateStatus } from "@/lib/services/shipping";
import { cn, firstParam } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/account/page-header";
import { OrderCard } from "@/components/account/order-card";

export const metadata: Metadata = { title: "Orders" };

const FILTERS = { all: "All", active: "In progress", delivered: "Delivered", cancelled: "Cancelled" } as const;
type Filter = keyof typeof FILTERS;

export default async function OrdersPage(props: PageProps<"/account/orders">) {
  const user = await requireUser("/account/orders");
  const f = firstParam((await props.searchParams).status);
  const filter: Filter = f && f in FILTERS ? (f as Filter) : "all";
  const orders = await getOrders(user.id);
  const withStatus = orders.map((o) => ({ o, s: aggregateStatus(o.storeOrders.map((so) => so.status)) }));
  const counts: Record<Filter, number> = {
    all: orders.length,
    active: withStatus.filter((x) => x.s !== "delivered" && x.s !== "cancelled").length,
    delivered: withStatus.filter((x) => x.s === "delivered").length,
    cancelled: withStatus.filter((x) => x.s === "cancelled").length,
  };
  const shown = withStatus
    .filter((x) => filter === "all" || (filter === "active" ? x.s !== "delivered" && x.s !== "cancelled" : x.s === filter))
    .map((x) => x.o);

  return (
    <div>
      <PageHeader title="Orders" description="Every order, and where each shop’s shipment is right now." />
      <nav aria-label="Filter orders" className="scrollbar-none mb-6 flex gap-1.5 overflow-x-auto">
        {(Object.keys(FILTERS) as Filter[]).map((k) => (
          <Link
            key={k}
            href={k === "all" ? "/account/orders" : `/account/orders?status=${k}`}
            aria-current={filter === k ? "true" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm transition-colors",
              filter === k ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
            )}
          >
            {FILTERS[k]} <span className={cn("text-xs tabular-nums", filter === k ? "text-ink-inverse/70" : "text-ink-subtle")}>{counts[k]}</span>
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filter === "all" ? "No orders yet" : `No ${FILTERS[filter].toLowerCase()} orders`}
          description={filter === "all" ? "Your orders will show up here once you check out." : "Try a different filter."}
          action={
            <Button asChild>
              <Link href={filter === "all" ? "/search" : "/account/orders"}>{filter === "all" ? "Start shopping" : "View all orders"}</Link>
            </Button>
          }
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <div className="space-y-3">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
