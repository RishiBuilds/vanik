import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Mail, MapPin, Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOrder } from "@/lib/queries/account";
import { formatDate, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardBrandMark } from "@/components/forms/card-brand";
import { SummaryRows } from "@/components/cart/order-summary";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function ConfirmationPage(props: PageProps<"/checkout/confirmation/[orderId]">) {
  const { orderId } = await props.params;
  const user = await requireUser(`/checkout/confirmation/${orderId}`);
  const order = await getOrder(user.id, orderId);
  if (!order) notFound();
  const a = order.shippingAddress;
  const itemCount = order.storeOrders.reduce((n, so) => n + so.items.reduce((m, i) => m + i.quantity, 0), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-success/20 [animation-iteration-count:2]" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-success text-white shadow-md">
            <Check className="size-8" strokeWidth={2.5} />
          </span>
        </div>
        <p className="eyebrow mt-6">Order {order.number}</p>
        <h1 className="mt-2 font-display font-bold text-4xl tracking-display sm:text-5xl">Thank you, {user.name.split(" ")[0]}.</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-ink-muted">
          Your order is confirmed. {order.storeOrders.length > 1 ? `${order.storeOrders.length} shops are` : `${order.storeOrders[0]!.store.name} is`} getting it ready — we’ll email you as each package ships.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-subtle">
          <Mail className="size-3.5" /> Confirmation sent to {order.email}
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {order.storeOrders.map((so) => (
          <section key={so.id} className="rounded-xl border-2 border-line bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line px-5 py-3.5 text-sm">
              <span className="flex items-center gap-2 font-semibold">
                <Package className="size-4 text-ink-subtle" /> {so.store.name}
              </span>
              <span className="text-xs text-ink-muted">
                {so.shippingMethod} · estimated delivery {so.estimatedDelivery ? formatDate(so.estimatedDelivery) : "soon"}
              </span>
            </header>
            <ul className="divide-y divide-line">
              {so.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{i.title}</span>
                    <span className="block text-xs text-ink-subtle">
                      {i.variantLabel ? `${i.variantLabel} · ` : ""}Qty {i.quantity}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-line bg-surface p-5 text-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="size-4 text-ink-subtle" /> Shipping to
          </h2>
          <address className="mt-2 not-italic leading-relaxed text-ink-muted">
            {a.fullName}
            <br />
            {a.line1}
            {a.line2 ? `, ${a.line2}` : ""}
            <br />
            {a.city}, {a.region} {a.postalCode}
          </address>
          <h2 className="mt-5 font-semibold">Payment</h2>
          <p className="mt-2 flex items-center gap-2 text-ink-muted">
            <CardBrandMark brand={order.payment.type === "card" ? order.payment.brand : order.payment.brand} /> {order.payment.label}
          </p>
        </div>
        <div className="rounded-xl border-2 border-line bg-surface p-5">
          <SummaryRows
            itemCount={itemCount}
            totals={{
              subtotal: order.subtotal,
              shipping: order.shippingTotal,
              shippingDiscount: 0,
              discount: order.discountTotal,
              tax: order.taxTotal,
              total: order.total,
            }}
          />
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={`/account/orders/${order.id}`}>
            Track your order <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
