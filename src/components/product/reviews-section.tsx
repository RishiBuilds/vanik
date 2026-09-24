import Link from "next/link";
import { BadgeCheck, MessageSquareText, Store } from "lucide-react";
import type { getProductReviews, ReviewSort } from "@/lib/queries/catalog";
import { cn, formatDate } from "@/lib/utils";
import { Avatar, Rating } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { HelpfulButton } from "./helpful-button";
import { ReviewFormDialog } from "./review-form";

type Data = Awaited<ReturnType<typeof getProductReviews>>;

const SORT_LABELS: Record<ReviewSort, string> = { recent: "Most recent", helpful: "Most helpful", highest: "Highest", lowest: "Lowest" };

export function ReviewsSection({
  data,
  rating,
  reviewCount,
  basePath,
  searchParams,
  sort,
  filterRating,
  storeName,
  eligibility,
  product,
}: {
  data: Data;
  rating: number;
  reviewCount: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  sort: ReviewSort;
  filterRating?: number;
  storeName: string;
  eligibility: { state: "signed-out" } | { state: "can-review" } | { state: "not-purchased" } | { state: "reviewed"; review: { rating: number; title: string; body: string } };
  product: { id: string; title: string };
}) {
  const total = data.breakdown.reduce((s, b) => s + b.count, 0);
  const link = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v != null && !k.startsWith("r")) (Array.isArray(v) ? v : [v]).forEach((x) => sp.append(k, x));
    const merged = { rsort: sort === "recent" ? null : sort, rrating: filterRating ? String(filterRating) : null, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}#reviews`;
  };

  const writeCta =
    eligibility.state === "signed-out" ? (
      <Button asChild variant="outline" block>
        <Link href={`/sign-in?next=${encodeURIComponent(basePath + "#reviews")}`}>Sign in to write a review</Link>
      </Button>
    ) : eligibility.state === "can-review" ? (
      <ReviewFormDialog productId={product.id} productTitle={product.title} trigger={<Button block>Write a review</Button>} />
    ) : eligibility.state === "reviewed" ? (
      <ReviewFormDialog
        productId={product.id}
        productTitle={product.title}
        initial={eligibility.review}
        trigger={
          <Button variant="outline" block>
            Edit your review
          </Button>
        }
      />
    ) : (
      <p className="rounded-lg bg-muted px-4 py-3 text-xs leading-relaxed text-ink-muted">
        Reviews are open to shoppers who’ve purchased this item — it keeps feedback honest.
      </p>
    );

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-40">
      <h2 id="reviews-heading" className="font-display font-bold text-3xl tracking-display">
        Reviews
      </h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
        <div>
          <div className="flex items-end gap-3">
            <span className="font-display font-bold text-6xl leading-none tracking-display">{reviewCount ? rating.toFixed(1) : "–"}</span>
            <div className="pb-1">
              <Rating value={rating} size="md" />
              <p className="mt-1 text-xs text-ink-subtle">
                Based on {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-1.5">
            {data.breakdown.map((b) => {
              const pct = total ? b.count / total : 0;
              const active = filterRating === b.rating;
              return (
                <li key={b.rating}>
                  <Link
                    href={link({ rrating: active ? null : String(b.rating), rpage: null })}
                    scroll={false}
                    className={cn(
                      "-mx-2 flex items-center gap-3 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
                      active && "bg-muted font-medium",
                      b.count === 0 && "pointer-events-none opacity-50",
                    )}
                    aria-label={`${b.rating} star reviews: ${b.count}`}
                  >
                    <span className="w-3 tabular-nums">{b.rating}</span>
                    <span className="h-3 flex-1 overflow-hidden rounded-base border-2 border-border bg-secondary-background">
                      <span className="block h-full border-r-2 border-border bg-main" style={{ width: `${pct * 100}%` }} />
                    </span>
                    <span className="w-8 text-right tabular-nums text-ink-subtle">{b.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">{writeCta}</div>
        </div>

        <div className="min-w-0">
          {total > 0 && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
              <p className="text-sm text-ink-muted">
                {filterRating ? (
                  <>
                    Showing {data.total} {filterRating}-star review{data.total === 1 ? "" : "s"} ·{" "}
                    <Link href={link({ rrating: null, rpage: null })} scroll={false} className="font-medium text-ink underline underline-offset-4">
                      Show all
                    </Link>
                  </>
                ) : (
                  <>{data.total} reviews</>
                )}
              </p>
              <nav aria-label="Sort reviews" className="flex flex-wrap gap-1">
                {(Object.keys(SORT_LABELS) as ReviewSort[]).map((k) => (
                  <Link
                    key={k}
                    href={link({ rsort: k === "recent" ? null : k, rpage: null })}
                    scroll={false}
                    aria-current={sort === k ? "true" : undefined}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs transition-colors",
                      sort === k ? "bg-main text-main-foreground" : "text-ink-muted hover:bg-muted hover:text-ink",
                    )}
                  >
                    {SORT_LABELS[k]}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {data.items.length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              compact
              title={total === 0 ? "No reviews yet" : "No reviews match"}
              description={total === 0 ? "Be the first to share what you think once your order arrives." : "Try another star rating."}
            />
          ) : (
            <ul className="divide-y divide-line">
              {data.items.map((r) => (
                <li key={r.id} className="py-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.user.image} name={r.user.name} size={36} />
                      <div>
                        <p className="text-sm font-medium">{r.user.name.split(" ")[0]} {r.user.name.split(" ")[1]?.[0] ?? ""}.</p>
                        <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                          {r.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-success">
                              <BadgeCheck className="size-3.5" /> Verified purchase
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
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{r.body}</p>
                  {r.vendorResponse && (
                    <div className="mt-4 rounded-lg border-l-2 border-accent bg-muted/60 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <Store className="size-3.5 text-accent" /> Response from {storeName}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">{r.vendorResponse}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <HelpfulButton reviewId={r.id} count={r.helpfulCount} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination page={data.page} pageCount={data.pageCount} basePath={basePath} params={searchParams} pageParam="rpage" className="mt-6" />
        </div>
      </div>
    </section>
  );
}
