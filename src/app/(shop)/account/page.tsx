import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ArrowRight, Heart, MapPin, Package, Star, Truck } from "lucide-react";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getAddresses, getMyFavoriteIds, getOrders } from "@/lib/queries/account";
import { getProductCardsByIds } from "@/lib/queries/catalog";
import { getNotifications } from "@/lib/queries/notifications";
import { aggregateStatus } from "@/lib/services/shipping";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, StatCard } from "@/components/account/page-header";
import { OrderCard } from "@/components/account/order-card";
import { ProductGrid } from "@/components/shop/product-card";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountOverview() {
  const user = await requireUser("/account");
  const [orders, favIds, addresses, notes, [reviewRow], profile] = await Promise.all([
    getOrders(user.id),
    getMyFavoriteIds(),
    getAddresses(user.id),
    getNotifications(user.id, { limit: 4 }),
    db.select({ n: sql<number>`count(*)` }).from(schema.reviews).where(eq(schema.reviews.userId, user.id)),
    db.query.user.findFirst({ where: eq(schema.user.id, user.id), columns: { createdAt: true } }),
  ]);
  const favCards = await getProductCardsByIds([...favIds].slice(0, 4));
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(aggregateStatus(o.storeOrders.map((s) => s.status))));
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div>
      <PageHeader
        eyebrow={profile ? `Member since ${new Date(profile.createdAt).getUTCFullYear()}` : undefined}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Track orders, manage your saved details and pick up where you left off."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders" value={orders.length} icon={<Package />} hint="All time" />
        <StatCard label="On the way" value={active.length} icon={<Truck />} hint={active.length ? "Arriving soon" : "Nothing in transit"} />
        <StatCard label="Wishlist" value={favIds.size} icon={<Heart />} hint="Saved items" />
        <StatCard label="Reviews" value={Number(reviewRow?.n ?? 0)} icon={<Star />} hint="Written by you" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-orders">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-orders" className="text-base font-semibold">
              {active.length ? "In progress" : "Recent orders"}
            </h2>
            <Link href="/account/orders" className="group inline-flex items-center gap-1 text-sm font-medium">
              All orders <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="When you place an order, you’ll be able to track it here."
              action={
                <Button asChild>
                  <Link href="/search">Start shopping</Link>
                </Button>
              }
              className="rounded-xl border-2 border-line bg-surface"
              compact
            />
          ) : (
            <div className="space-y-3">
              {(active.length ? active : orders).slice(0, 3).map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Latest updates"
              action={
                <Link href="/account/notifications" className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  View all
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {notes.length === 0 && <li className="px-6 py-5 text-sm text-ink-muted">You’re all caught up.</li>}
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? "/account/notifications"} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 sm:px-6">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-accent"}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{n.title}</span>
                      <span className="line-clamp-1 block text-xs text-ink-muted">{n.body}</span>
                      <span className="mt-0.5 block text-2xs text-ink-subtle">{timeAgo(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader
              title="Default address"
              action={
                <Link href="/account/addresses" className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  Manage
                </Link>
              }
            />
            <CardBody className="text-sm">
              {defaultAddress ? (
                <p className="flex gap-3 text-ink-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                  <span>
                    <span className="block font-medium text-ink">{defaultAddress.fullName}</span>
                    {defaultAddress.line1}
                    {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
                    <br />
                    {defaultAddress.city}, {defaultAddress.region} {defaultAddress.postalCode}
                  </span>
                </p>
              ) : (
                <p className="text-ink-muted">
                  No saved address yet.{" "}
                  <Link href="/account/addresses" className="font-medium text-ink underline underline-offset-4">
                    Add one
                  </Link>
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {favCards.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">From your wishlist</h2>
            <Link href="/account/wishlist" className="group inline-flex items-center gap-1 text-sm font-medium">
              See all {favIds.size} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ProductGrid products={favCards} favorites={favIds} className="md:grid-cols-4 xl:grid-cols-4" />
        </section>
      )}
    </div>
  );
}
