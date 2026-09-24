import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MapPin, Package, Phone, Repeat } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getVendorOrder } from "@/lib/queries/vendor-orders";
import { PLATFORM_FEE_RATE } from "@/lib/services/pricing";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CopyText } from "@/components/ui/copy-button";
import { StatusBadge, TrackingTimeline } from "@/components/orders/status";
import { CardBrandMark } from "@/components/forms/card-brand";
import { FulfillmentPanel } from "@/components/vendor/fulfillment-panel";

export const metadata: Metadata = { title: "Order · Seller" };

export default async function VendorOrderPage(props: PageProps<"/vendor/orders/[id]">) {
  const { id } = await props.params;
  const { store } = await requireVendor();
  const so = await getVendorOrder(store.id, id);
  if (!so) notFound();
  const order = so.order;
  const a = order.shippingAddress;
  const itemCount = so.items.reduce((n, i) => n + i.quantity, 0);
  const gross = so.subtotal + so.shippingCost;
  const fee = Math.round(gross * PLATFORM_FEE_RATE);

  return (
    <div>
      <Link href="/vendor/orders" className="mb-5 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink print:hidden">
        <ChevronLeft className="size-4" /> Orders
      </Link>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-bold text-3xl tracking-display sm:text-4xl">Order {order.number}</h1>
            <StatusBadge status={so.status} />
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Placed {formatDateTime(so.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"} · {so.shippingMethod} shipping
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Items" description={`Ship to ${a.fullName} by ${so.estimatedDelivery ? formatDate(so.estimatedDelivery) : "the estimated date"}`} />
            <ul className="divide-y divide-line">
              {so.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {i.product ? (
                      <Link href={`/vendor/products/${i.product.id}`} className="text-sm font-medium hover:underline hover:underline-offset-4">
                        {i.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{i.title}</p>
                    )}
                    <p className="text-xs text-ink-subtle">
                      {i.variantLabel ? `${i.variantLabel} · ` : ""}
                      <span className="font-mono">{i.sku}</span>
                    </p>
                  </div>
                  <p className="text-sm tabular-nums text-ink-muted">
                    {formatMoney(i.unitPrice)} × {i.quantity}
                  </p>
                  <p className="w-24 text-right text-sm font-semibold tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t-2 border-line px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Items subtotal</dt>
                <dd className="tabular-nums">{formatMoney(so.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping collected ({so.shippingMethod})</dt>
                <dd className="tabular-nums">{so.shippingCost === 0 ? "Free" : formatMoney(so.shippingCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Vanik commission ({Math.round(PLATFORM_FEE_RATE * 100)}%)</dt>
                <dd className="tabular-nums">−{formatMoney(fee)}</dd>
              </div>
              <div className="flex justify-between border-t-2 border-line pt-3 font-semibold">
                <dt>Your earnings</dt>
                <dd className="tabular-nums">{so.status === "cancelled" ? formatMoney(0) : formatMoney(gross - fee)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Timeline" description="Every status change is shared with the customer." />
            <CardBody>
              <TrackingTimeline status={so.status} events={so.events} />
              {so.trackingNumber && (
                <p className="mt-6 flex flex-wrap items-center gap-2 border-t-2 border-line pt-4 text-xs text-ink-muted">
                  <Package className="size-3.5" /> {so.carrier} · <CopyText value={so.trackingNumber} label="Copy tracking number" />
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="print:hidden">
            <CardHeader title="Fulfilment" />
            <CardBody>
              <FulfillmentPanel storeOrderId={so.id} status={so.status} defaultCarrier={so.carrier ?? (so.shippingMethod === "Express" ? "Blue Dart" : "Delhivery")} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Customer" />
            <CardBody className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar src={order.user.image} name={order.user.name} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.user.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                    {so.customerHistory.orders > 1 ? (
                      <Badge size="sm" tone="accent">
                        <Repeat /> {so.customerHistory.orders} orders · {formatMoney(so.customerHistory.spent)}
                      </Badge>
                    ) : (
                      "First order from your shop"
                    )}
                  </p>
                </div>
              </div>
              <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order ${order.number}`)}`} className="flex items-center gap-2 text-ink-muted hover:text-ink">
                <Mail className="size-4 text-ink-subtle" /> {order.email}
              </a>
              {a.phone && (
                <p className="flex items-center gap-2 text-ink-muted">
                  <Phone className="size-4 text-ink-subtle" /> {a.phone}
                </p>
              )}
              <div className="border-t-2 border-line pt-4">
                <p className="flex items-center gap-2 font-medium">
                  <MapPin className="size-4 text-ink-subtle" /> Shipping address
                </p>
                <address className="mt-2 not-italic leading-relaxed text-ink-muted">
                  {a.fullName}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.region} {a.postalCode}
                </address>
              </div>
              <div className="border-t-2 border-line pt-4">
                <p className="font-medium">Payment</p>
                <p className="mt-2 flex items-center gap-2 text-ink-muted">
                  <CardBrandMark brand={order.payment.brand} /> {order.payment.label}
                </p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {order.paymentStatus === "paid" ? "Captured" : order.paymentStatus === "pending" ? "Collect on delivery" : "Refunded"}
                </p>
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
