"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackageCheck, Truck, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { bulkAdvance } from "@/lib/actions/vendor-orders";
import type { FulfillmentStatus } from "@/lib/db/schema";
import { cn, formatDateTime, formatMoney } from "@/lib/utils";
import { Checkbox } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { StatusBadge } from "@/components/orders/status";

type Row = {
  id: string;
  number: string;
  status: FulfillmentStatus;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerImage: string | null;
  city: string;
  items: number;
  preview: string[];
  paymentLabel: string;
  paymentStatus: string;
};

export function VendorOrdersTable({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const all = rows.length > 0 && selected.size === rows.length;
  const some = selected.size > 0 && !all;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const bulk = (next: "confirmed" | "packed" | "shipped") =>
    start(async () => {
      const r = await bulkAdvance([...selected], next);
      if (r.ok) {
        toast.success(r.message ?? "Updated");
        setSelected(new Set());
      } else toast.error(r.error);
    });

  return (
    <div className="relative">
      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-4 py-2.5 shadow-md animate-slide-up">
          <span className="mr-2 text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk("confirmed")} loading={pending}>
            <CheckCircle2 /> Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk("packed")} loading={pending}>
            <PackageCheck /> Mark packed
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk("shipped")} loading={pending}>
            <Truck /> Mark shipped
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-ink-subtle hover:bg-muted" aria-label="Clear selection">
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border-2 border-line bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b-2 border-line bg-muted/50">
            <tr className="text-left text-xs text-ink-muted">
              <th className="w-12 py-2.5 pl-5">
                <Checkbox
                  checked={all ? true : some ? "indeterminate" : false}
                  onCheckedChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
                  aria-label="Select all orders"
                />
              </th>
              <th className="py-2.5 pr-4 font-medium">Order</th>
              <th className="py-2.5 pr-4 font-medium">Customer</th>
              <th className="py-2.5 pr-4 font-medium">Items</th>
              <th className="py-2.5 pr-4 font-medium">Status</th>
              <th className="py-2.5 pr-4 font-medium">Delivery</th>
              <th className="py-2.5 pr-5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={cn("transition-colors hover:bg-muted/40", selected.has(r.id) && "bg-accent-soft/40")}>
                <td className="py-3 pl-5">
                  <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Select order ${r.number}`} />
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/vendor/orders/${r.id}`} className="font-mono font-medium hover:underline hover:underline-offset-4">
                    {r.number}
                  </Link>
                  <p className="text-xs text-ink-subtle">{formatDateTime(r.createdAt)}</p>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={r.customerImage} name={r.customerName} size={30} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.customerName}</p>
                      <p className="truncate text-xs text-ink-subtle">{r.city}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {r.preview.map((src, i) => (
                        <span key={i} className="relative size-8 overflow-hidden rounded-md bg-muted ring-2 ring-surface">
                          <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-ink-muted">{r.items}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={r.status} size="sm" />
                  {r.paymentStatus !== "paid" && <p className="mt-1 text-2xs text-ink-subtle">{r.paymentStatus === "pending" ? "COD · unpaid" : "Refunded"}</p>}
                </td>
                <td className="py-3 pr-4 text-xs text-ink-muted">{r.shippingMethod}</td>
                <td className="py-3 pr-5 text-right font-semibold tabular-nums">{formatMoney(r.subtotal + r.shippingCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
