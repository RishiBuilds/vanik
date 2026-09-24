import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MapPin, Package, Star, Truck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOrder, getReviewedProductIds } from "@/lib/queries/account";
import { aggregateStatus, STATUS_META } from "@/lib/services/shipping";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyText } from "@/components/ui/copy-button";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge, TrackingTimeline } from "@/components/orders/status";
import { SummaryRows } from "@/components/cart/order-summary";
import { CardBrandMark } from "@/components/forms/card-brand";
import { ReviewFormDialog } from "@/components/product/review-form";
import { BuyAgainButton, CancelShipmentButton } from "@/components/account/order-actions";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrder(user.id, id);
  if (!order) notFound();
  const productIds = order.storeOrders.flatMap((so) => so.items.map((i) => i.productId).filter((x): x is string => !!x));
  const reviewed = await getReviewedProductIds(user.id, productIds);
  const status = aggregateStatus(order.storeOrders.map((s) => s.status));
  const a = order.shippingAddress;
  const count = order.storeOrders.reduce((n, so) => n + so.items.reduce((m, i) => m + i.quantity, 0), 0);

  return (
    <div>
      <Link href="/account/orders" className="mb-5 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" /> All orders
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-bold text-3xl tracking-display sm:text-4xl">Order {order.number}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Placed {formatDateTime(order.createdAt)} · {count} item{count === 1 ? "" : "s"} · {formatMoney(order.total)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {order.storeOrders.map((so, idx) => (
            <section key={so.id} className="rounded-xl border-2 border-line bg-surface" aria-label={`Shipment from ${so.store.name}`}>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line px-5 py-4 sm:px-6">
                <div>
                  <p className="eyebrow">
                    Shipment {idx + 1} of {order.storeOrders.length}
                  </p>
                  <Link href={`/s/${so.store.slug}`} className="mt-1 flex items-center gap-2 text-base font-semibold hover:underline hover:underline-offset-4">
                    {so.store.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={so.status} />
                  {["placed", "confirmed"].includes(so.status) && <CancelShipmentButton storeOrderId={so.id} storeName={so.store.name} />}
                </div>
              </header>
              <div className="grid gap-8 px-5 py-6 sm:px-6 md:grid-cols-[1fr_16rem]">
                <ul className="space-y-4">
                  {so.items.map((i) => {
                    const canReview = so.status === "delivered" && i.productId && !reviewed.has(i.productId);
                    return (
                      <li key={i.id} className="flex gap-4">
                        {i.product ? (
                          <Link href={`/p/${i.product.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {i.image && <Image src={i.image} alt={i.title} fill sizes="80px" className="object-cover" />}
                          </Link>
                        ) : (
                          <span className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {i.image && <Image src={i.image} alt={i.title} fill sizes="80px" className="object-cover" />}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <div className="min-w-0">
                              {i.product ? (
                                <Link href={`/p/${i.product.slug}`} className="text-sm font-medium hover:underline hover:underline-offset-4">
                                  {i.title}
                                </Link>
                              ) : (
                                <p className="text-sm font-medium">{i.title}</p>
                              )}
                              <p className="mt-0.5 text-xs text-ink-subtle">
                                {i.variantLabel ? `${i.variantLabel} · ` : ""}Qty {i.quantity} · {formatMoney(i.unitPrice)} each
                              </p>
                            </div>
                            <p className="shrink-0 text-sm tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</p>
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <BuyAgainButton variantId={i.variantId} />
                            {canReview && (
                              <ReviewFormDialog
                                productId={i.productId!}
                                productTitle={i.title}
                                trigger={
                                  <Button variant="outline" size="xs">
                                    <Star /> Write a review
                                  </Button>
                                }
                              />
                            )}
                            {so.status === "delivered" && i.productId && reviewed.has(i.productId) && (
                              <span className="inline-flex h-7 items-center gap-1 text-xs text-ink-subtle">
                                <Star className="size-3.5" /> Reviewed
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="md:border-l-2 md:border-line md:pl-6">
                  <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <Truck className="size-4 text-ink-subtle" /> Tracking
                  </p>
                  <TrackingTimeline status={so.status} events={so.events} />
                </div>
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t-2 border-line bg-muted/40 px-5 py-3.5 text-xs text-ink-muted sm:px-6">
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="size-3.5" /> {so.shippingMethod}
                    {so.carrier ? ` · ${so.carrier}` : ""}
                  </span>
                  {so.trackingNumber && (
                    <CopyText value={so.trackingNumber} label="Copy tracking number" />
                  )}
                  {so.status !== "delivered" && so.status !== "cancelled" && so.estimatedDelivery && (
                    <span>Estimated delivery {formatDate(so.estimatedDelivery)}</span>
                  )}
                  {so.status === "delivered" && <span className="text-success">{STATUS_META.delivered.description}</span>}
                </span>
                {so.store.supportEmail && (
                  <a href={`mailto:${so.store.supportEmail}?subject=${encodeURIComponent(`Order ${order.number}`)}`} className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline hover:underline-offset-4">
                    <Mail className="size-3.5" /> Contact shop
                  </a>
                )}
              </footer>
            </section>
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-36 xl:self-start">
          <Card>
            <CardBody>
              <h2 className="text-sm font-semibold">Payment summary</h2>
              <SummaryRows
                className="mt-4"
                itemCount={count}
                totals={{ subtotal: order.subtotal, shipping: order.shippingTotal, shippingDiscount: 0, discount: order.discountTotal, tax: order.taxTotal, total: order.total }}
              />
              {order.promoCode && <p className="mt-3 text-xs text-success">Promo {order.promoCode} applied</p>}
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-5 text-sm">
              <div>
                <h2 className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-ink-subtle" /> Shipping address
                </h2>
                <address className="mt-2 not-italic leading-relaxed text-ink-muted">
                  {a.fullName}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.region} {a.postalCode}
                </address>
              </div>
              <div>
                <h2 className="font-semibold">Payment method</h2>
                <p className="mt-2 flex items-center gap-2 text-ink-muted">
                  <CardBrandMark brand={order.payment.brand} /> {order.payment.label}
                </p>
                <p className="mt-1.5 text-xs text-ink-subtle">
                  {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Payment due on delivery"}
                </p>
              </div>
            </CardBody>
          </Card>
          <p className="px-1 text-xs leading-relaxed text-ink-subtle">
            Something wrong with your order?{" "}
            <Link href="/help/orders" className="underline underline-offset-2 hover:text-ink">
              Visit the help center
            </Link>{" "}
            — you’re covered by Vanik buyer protection.
          </p>
        </aside>
      </div>
    </div>
  );
}
