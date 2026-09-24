import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageSquareText, Package } from "lucide-react";
import { requireVendor } from "@/lib/session";
import {
  getReviewFilterCounts,
  getReviewSummary,
  getVendorReviews,
  type ReviewFilter,
  type VendorReviewSort,
} from "@/lib/queries/vendor-store";
import { cn, firstParam, formatDate, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/account/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, ProgressBar, Rating } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { ReviewReply } from "@/components/vendor/store/review-reply";

export const metadata: Metadata = { title: "Reviews · Seller" };

const FILTERS: Record<ReviewFilter, string> = { all: "All", unanswered: "Needs reply", answered: "Answered" };
const SORTS: Record<VendorReviewSort, string> = { newest: "Newest", lowest: "Lowest rated" };

export default async function VendorReviewsPage(props: PageProps<"/vendor/reviews">) {
  const { store } = await requireVendor();
  const sp = await props.searchParams;
  const f = firstParam(sp.filter);
  const filter: ReviewFilter = f && f in FILTERS ? (f as ReviewFilter) : "all";
  const so = firstParam(sp.sort);
  const sort: VendorReviewSort = so === "lowest" ? "lowest" : "newest";
  const ratingN = Number(firstParam(sp.rating));
  const rating = ratingN >= 1 && ratingN <= 5 ? Math.round(ratingN) : undefined;
  const page = Number(firstParam(sp.page)) || 1;

  const [summary, counts, data] = await Promise.all([
    getReviewSummary(store.id),
    getReviewFilterCounts(store.id, rating),
    getVendorReviews(store.id, { filter, rating, sort, page }),
  ]);

  const href = (patch: Partial<Record<"filter" | "sort" | "rating", string | null>>) => {
    const cur: Record<string, string | null> = {
      filter: filter === "all" ? null : filter,
      sort: sort === "newest" ? null : sort,
      rating: rating ? String(rating) : null,
      ...patch,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    const qs = p.toString();
    return `/vendor/reviews${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Reviews" description="Read what buyers say and reply publicly — a thoughtful reply builds trust with future shoppers." />

      {summary.total === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Buyers can review products after their order is delivered. Reviews will appear here for you to reply to."
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="p-5">
              <p className="text-xs font-medium text-ink-muted">Average rating</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-5xl font-semibold leading-none tracking-tightish tabular-nums">{summary.average.toFixed(1)}</span>
                <div className="pb-0.5">
                  <Rating value={summary.average} size="md" />
                  <p className="mt-1 text-xs text-ink-subtle">
                    {summary.total} review{summary.total === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-1">
                {summary.breakdown.map((b) => {
                  const active = rating === b.rating;
                  return (
                    <li key={b.rating}>
                      <Link
                        href={href({ rating: active ? null : String(b.rating) })}
                        aria-current={active ? "true" : undefined}
                        aria-label={`${b.rating} star reviews: ${b.count}${active ? " (filter active)" : ""}`}
                        className={cn(
                          "-mx-2 flex items-center gap-3 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
                          active && "bg-muted font-medium",
                          b.count === 0 && "pointer-events-none opacity-50",
                        )}
                      >
                        <span className="w-3 tabular-nums">{b.rating}</span>
                        <span className="h-3 flex-1 overflow-hidden rounded-base border-2 border-border bg-secondary-background">
                          <span className="block h-full border-r-2 border-border bg-main" style={{ width: `${(b.count / summary.total) * 100}%` }} />
                        </span>
                        <span className="w-8 text-right tabular-nums text-ink-subtle">{b.count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-muted">Response rate</p>
                <p className="text-sm font-semibold tabular-nums">{formatPercent(summary.responseRate, 0)}</p>
              </div>
              <ProgressBar value={summary.responseRate} tone="accent" className="mt-3" />
              <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
                {summary.unanswered === 0
                  ? "You’ve replied to every review. Nice work."
                  : `${summary.unanswered} review${summary.unanswered === 1 ? "" : "s"} waiting for a reply. Shops that reply get more repeat buyers.`}
              </p>
            </Card>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <nav aria-label="Filter reviews" className="scrollbar-none flex gap-1.5 overflow-x-auto">
                {(Object.keys(FILTERS) as ReviewFilter[]).map((k) => (
                  <Link
                    key={k}
                    href={href({ filter: k === "all" ? null : k })}
                    aria-current={filter === k ? "true" : undefined}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm transition-colors",
                      filter === k ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                    )}
                  >
                    {FILTERS[k]}
                    <span className={cn("text-xs tabular-nums", filter === k ? "text-ink-inverse/70" : "text-ink-subtle")}>{counts[k]}</span>
                  </Link>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-2">
                {rating && (
                  <Link
                    href={href({ rating: null })}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-accent-soft px-3 text-xs font-medium text-accent-ink hover:bg-accent-soft/70"
                  >
                    {rating}-star only <span aria-hidden>×</span>
                    <span className="sr-only">Clear rating filter</span>
                  </Link>
                )}
                <nav aria-label="Sort reviews" className="flex gap-1">
                  {(Object.keys(SORTS) as VendorReviewSort[]).map((k) => (
                    <Link
                      key={k}
                      href={href({ sort: k === "newest" ? null : k })}
                      aria-current={sort === k ? "true" : undefined}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs transition-colors",
                        sort === k ? "bg-main text-main-foreground" : "text-ink-muted hover:bg-muted hover:text-ink",
                      )}
                    >
                      {SORTS[k]}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {data.items.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                compact
                title={filter === "unanswered" ? "You’re all caught up" : "No reviews match"}
                description={filter === "unanswered" ? "Every review has a reply." : "Try a different filter or star rating."}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/vendor/reviews">View all reviews</Link>
                  </Button>
                }
                className="rounded-xl border-2 border-line bg-surface"
              />
            ) : (
              <ul className="space-y-4">
                {data.items.map((r) => {
                  const thumb = r.product.images[0]?.url;
                  return (
                    <li key={r.id}>
                      <Card className="p-5 sm:p-6">
                        <Link href={`/p/${r.product.slug}`} className="group mb-4 flex items-center gap-3 border-b-2 border-line pb-4">
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                            {thumb ? (
                              <Image src={thumb} alt="" fill sizes="44px" className="object-cover" />
                            ) : (
                              <Package className="absolute inset-0 m-auto size-4 text-ink-subtle" aria-hidden />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-2xs font-medium uppercase tracking-eyebrow text-ink-subtle">Product</span>
                            <span className="block truncate text-sm font-medium group-hover:underline">{r.product.title}</span>
                          </span>
                        </Link>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar src={r.user.image} name={r.user.name} size={36} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{r.user.name}</p>
                              <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-subtle">
                                {r.verifiedPurchase && (
                                  <span className="inline-flex items-center gap-1 text-success">
                                    <BadgeCheck className="size-3.5" aria-hidden /> Verified purchase
                                  </span>
                                )}
                                {r.verifiedPurchase && r.variantLabel && <span aria-hidden>·</span>}
                                {r.variantLabel && <span>{r.variantLabel}</span>}
                              </p>
                            </div>
                          </div>
                          <time className="shrink-0 text-xs text-ink-subtle" dateTime={new Date(r.createdAt).toISOString()}>
                            {formatDate(r.createdAt)}
                          </time>
                        </div>
                        <Rating value={r.rating} size="sm" className="mt-4" />
                        <h3 className="mt-2 text-sm font-semibold">{r.title}</h3>
                        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{r.body}</p>
                        <ReviewReply
                          reviewId={r.id}
                          rating={r.rating}
                          reviewerName={r.user.name}
                          storeName={store.name}
                          response={r.vendorResponse}
                          respondedAt={r.respondedAt}
                        />
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
            <Pagination page={data.page} pageCount={data.pageCount} basePath="/vendor/reviews" params={sp} className="mt-6" />
          </div>
        </div>
      )}
    </div>
  );
}
