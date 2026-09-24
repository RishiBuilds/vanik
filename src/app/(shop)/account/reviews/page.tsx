import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { MessageSquareText, Star, Store } from "lucide-react";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/account/page-header";
import { MyReviewActions } from "@/components/account/review-actions";
import { ReviewFormDialog } from "@/components/product/review-form";

export const metadata: Metadata = { title: "Your reviews" };

export default async function MyReviewsPage() {
  const user = await requireUser("/account/reviews");
  const [reviews, delivered] = await Promise.all([
    db.query.reviews.findMany({
      where: eq(schema.reviews.userId, user.id),
      orderBy: desc(schema.reviews.createdAt),
      with: {
        product: { columns: { id: true, slug: true, title: true }, with: { images: { limit: 1, orderBy: (i, { asc }) => [asc(i.position)] } } },
        store: { columns: { name: true } },
      },
    }),
    db
      .selectDistinct({
        productId: schema.orderItems.productId,
        title: schema.orderItems.title,
        image: schema.orderItems.image,
        storeName: schema.stores.name,
      })
      .from(schema.orderItems)
      .innerJoin(schema.storeOrders, eq(schema.storeOrders.id, schema.orderItems.storeOrderId))
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
      .innerJoin(schema.stores, eq(schema.stores.id, schema.storeOrders.storeId))
      .where(and(eq(schema.orders.userId, user.id), eq(schema.storeOrders.status, "delivered"))),
  ]);
  const reviewedIds = new Set(reviews.map((r) => r.productId));
  const seen = new Set<string>();
  const awaiting = delivered.filter((d) => d.productId && !reviewedIds.has(d.productId) && !seen.has(d.productId) && seen.add(d.productId));

  return (
    <div>
      <PageHeader title="Reviews" description="Help other shoppers — and the makers — by sharing what you think." />

      {awaiting.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold">Waiting for your review</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {awaiting.map((a) => (
              <li key={a.productId} className="flex items-center gap-4 rounded-xl border-2 border-line bg-surface p-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {a.image && <Image src={a.image} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="truncate text-xs text-ink-subtle">{a.storeName}</p>
                </div>
                <ReviewFormDialog
                  productId={a.productId!}
                  productTitle={a.title}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Star /> Review
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-4 text-base font-semibold">Your reviews ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Once an order is delivered, you can review it from here or from the order page."
          action={
            <Button asChild variant="outline">
              <Link href="/account/orders">View orders</Link>
            </Button>
          }
          className="rounded-xl border-2 border-line bg-surface"
          compact
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border-2 border-line bg-surface p-5 sm:p-6">
              <div className="flex gap-4">
                <Link href={`/p/${r.product.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {r.product.images[0] && <Image src={r.product.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/p/${r.product.slug}`} className="text-sm font-medium hover:underline hover:underline-offset-4">
                        {r.product.title}
                      </Link>
                      <p className="text-xs text-ink-subtle">
                        {r.store.name} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <MyReviewActions review={{ id: r.id, productId: r.productId, productTitle: r.product.title, rating: r.rating, title: r.title, body: r.body }} />
                  </div>
                  <Rating value={r.rating} className="mt-3" />
                  <p className="mt-2 text-sm font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{r.body}</p>
                  {r.vendorResponse && (
                    <div className="mt-4 rounded-lg border-l-2 border-accent bg-muted/60 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <Store className="size-3.5 text-accent" /> {r.store.name} replied
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">{r.vendorResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
