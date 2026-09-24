import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FulfillmentStatus } from "@/lib/db/schema";
import { aggregateStatus } from "@/lib/services/shipping";
import { formatDate, formatMoney } from "@/lib/utils";
import { StatusBadge, StatusProgress } from "@/components/orders/status";

type OrderLike = {
  id: string;
  number: string;
  createdAt: Date;
  total: number;
  storeOrders: { id: string; status: FulfillmentStatus; store: { name: string }; items: { id: string; title: string; image: string | null; quantity: number }[] }[];
};

export function OrderCard({ order }: { order: OrderLike }) {
  const status = aggregateStatus(order.storeOrders.map((s) => s.status));
  const items = order.storeOrders.flatMap((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const stores = [...new Set(order.storeOrders.map((s) => s.store.name))];
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group block rounded-xl border-2 border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-sm font-medium">{order.number}</p>
            <StatusBadge status={status} size="sm" />
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            Placed {formatDate(order.createdAt)} · {count} item{count === 1 ? "" : "s"} · {stores.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tabular-nums">{formatMoney(order.total)}</p>
          <ChevronRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {items.slice(0, 5).map((i) => (
          <span key={i.id} className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
            {i.image && <Image src={i.image} alt={i.title} fill sizes="56px" className="object-cover" />}
          </span>
        ))}
        {items.length > 5 && (
          <span className="flex size-14 items-center justify-center rounded-md bg-muted text-xs font-medium text-ink-muted">+{items.length - 5}</span>
        )}
      </div>
      {status !== "cancelled" && status !== "delivered" && (
        <div className="mt-4">
          <StatusProgress status={status} />
        </div>
      )}
      {order.storeOrders.length > 1 && (
        <p className="mt-3 text-xs text-ink-subtle">
          {order.storeOrders.length} shipments ·{" "}
          {order.storeOrders.map((s) => `${s.store.name}: ${s.status.replace(/_/g, " ")}`).join(" · ")}
        </p>
      )}
    </Link>
  );
}
