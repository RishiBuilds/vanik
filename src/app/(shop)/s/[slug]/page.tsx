import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Clock, Mail, MapPin, Package, RotateCcw, Truck } from "lucide-react";
import { getStoreBySlug } from "@/lib/queries/stores";
import { getMyFollowedStoreIds } from "@/lib/queries/account";
import { getSessionUser } from "@/lib/session";
import { parseBrowseParams } from "@/lib/browse-params";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";
import { Avatar, Rating } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreLogo } from "@/components/shop/store-card";
import { FollowButton } from "@/components/shop/follow-button";
import { BrowseView } from "@/components/browse/browse-view";

export async function generateMetadata(props: PageProps<"/s/[slug]">): Promise<Metadata> {
  const store = await getStoreBySlug((await props.params).slug);
  return store ? { title: store.name, description: store.tagline } : { title: "Shop not found" };
}

export default async function StorePage(props: PageProps<"/s/[slug]">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const store = await getStoreBySlug(slug);
  if (!store || store.status !== "active") notFound();
  const [user, follows] = await Promise.all([getSessionUser(), getMyFollowedStoreIds()]);
  const isOwner = user?.id === store.ownerId;
  const { view, ...query } = parseBrowseParams(searchParams);

  const stats = [
    { label: "Rating", value: store.reviewCount ? store.rating.toFixed(1) : "New", sub: `${formatNumber(store.reviewCount)} reviews` },
    { label: "Sales", value: formatNumber(store.salesCount), sub: "orders shipped" },
    { label: "Followers", value: formatNumber(store.followerCount), sub: "shoppers" },
    { label: "Items", value: formatNumber(store.productCount), sub: "in the shop" },
  ];

  return (
    <div>
      <div className="relative h-48 bg-muted sm:h-64 lg:h-80">
        {store.banner && <Image src={store.banner} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
      </div>

      <div className="container-page">
        <div className="relative -mt-14 flex flex-col gap-6 border-b-2 border-line pb-8 sm:-mt-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <StoreLogo src={store.logo} name={store.name} size={116} className="ring-[6px] ring-canvas shadow-md" />
            <div className="pb-1">
              <h1 className="flex items-center gap-2 font-display font-bold text-4xl tracking-display sm:text-5xl">
                {store.name}
                {store.verified && <BadgeCheck className="size-6 text-info" aria-label="Verified shop" />}
              </h1>
              <p className="mt-2 max-w-xl text-base text-ink-muted">{store.tagline}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {store.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> On Vanik since {new Date(store.createdAt).getUTCFullYear()}
                </span>
                {store.reviewCount > 0 && <Rating value={store.rating} count={store.reviewCount} size="xs" />}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner ? (
              <Button asChild variant="outline">
                <Link href="/vendor/settings">Edit shop</Link>
              </Button>
            ) : (
              <FollowButton storeId={store.id} storeName={store.name} initial={follows.has(store.id)} size="md" />
            )}
            {store.supportEmail && (
              <Button asChild variant="outline" size="md">
                <a href={`mailto:${store.supportEmail}`}>
                  <Mail /> Contact
                </a>
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="shop" className="mt-2">
          <TabsList className="mt-4">
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({formatNumber(store.reviewCount)})</TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="pt-8">
            <BrowseView
              query={{ ...query, storeId: store.id }}
              view={view}
              searchParams={searchParams}
              basePath={`/s/${store.slug}`}
              showStores={false}
            />
          </TabsContent>

          <TabsContent value="about" className="pt-8">
            <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-display font-bold text-2xl tracking-display">Our story</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-muted">
                  {store.description.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <Avatar src={store.owner.image} name={store.owner.name} size={44} />
                  <div>
                    <p className="text-sm font-medium">{store.owner.name}</p>
                    <p className="text-xs text-ink-subtle">Shop owner</p>
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-xl border-2 border-line bg-line">
                {stats.map((s) => (
                  <div key={s.label} className="bg-surface p-5">
                    <dt className="text-xs text-ink-subtle">{s.label}</dt>
                    <dd className="mt-1 font-display font-bold text-3xl">{s.value}</dd>
                    <dd className="text-xs text-ink-subtle">{s.sub}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </TabsContent>

          <TabsContent value="policies" className="pt-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Clock, title: "Processing time", body: store.policies.processingTime },
                { icon: Truck, title: "Shipping", body: store.policies.shipping },
                { icon: RotateCcw, title: "Returns & exchanges", body: store.policies.returns },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border-2 border-line bg-surface p-6">
                  <Icon className="size-5 text-accent" strokeWidth={1.75} />
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
                </div>
              ))}
            </div>
            {store.shippingRates.length > 0 && (
              <div className="mt-8 max-w-2xl">
                <h3 className="text-sm font-semibold">Shipping rates</h3>
                <ul className="mt-3 divide-y divide-line rounded-xl border-2 border-line bg-surface">
                  {store.shippingRates.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                      <span className="flex items-center gap-3">
                        <Package className="size-4 text-ink-subtle" />
                        <span>
                          {r.name} <span className="text-ink-subtle">· {r.zone} · {r.carrier} · {r.minDays}–{r.maxDays} working days</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        {formatMoney(r.price)}
                        {r.freeOver != null && <span className="block text-xs text-ink-subtle">Free over {formatMoney(r.freeOver)}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="pt-8">
            {store.recentReviews.length === 0 ? (
              <p className="text-sm text-ink-muted">No reviews yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {store.recentReviews.map((r) => (
                  <figure key={r.id} className="flex flex-col rounded-xl border-2 border-line bg-surface p-6">
                    <Rating value={r.rating} size="sm" />
                    <blockquote className="mt-3 flex-1">
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{r.body}</p>
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t-2 border-line pt-4">
                      <Avatar src={r.user.image} name={r.user.name} size={32} />
                      <div className="min-w-0 text-xs">
                        <p className="font-medium">{r.user.name}</p>
                        <p className="truncate text-ink-subtle">
                          on{" "}
                          <Link href={`/p/${r.product.slug}`} className="underline underline-offset-2 hover:text-ink">
                            {r.product.title}
                          </Link>{" "}
                          · {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
