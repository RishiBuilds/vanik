import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Leaf, RotateCcw, ShieldCheck, Store, Truck } from "lucide-react";
import { getCategoryTree, getFeaturedProducts, getNewArrivals, getOnSale, getTrendingProducts } from "@/lib/queries/catalog";
import { getFeaturedStores, getMarketplaceStats } from "@/lib/queries/stores";
import { getMyFavoriteIds } from "@/lib/queries/account";
import { formatNumber, unsplash } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/misc";
import { ProductGrid } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/shop/section";
import { StoreCard } from "@/components/shop/store-card";
import { NewsletterForm } from "@/components/shop/newsletter-form";

export default async function HomePage() {
  const [categories, featured, trending, arrivals, sale, stores, stats, favs] = await Promise.all([
    getCategoryTree(),
    getFeaturedProducts(8),
    getTrendingProducts(4),
    getNewArrivals(4),
    getOnSale(4),
    getFeaturedStores(6),
    getMarketplaceStats(),
    getMyFavoriteIds(),
  ]);

  return (
    <>

      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="max-w-xl animate-slide-up">
            <p className="eyebrow mb-5 inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent" /> {formatNumber(stats.stores)} independent shops · one checkout
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-display text-ink sm:text-6xl lg:text-[4.75rem]">
              Goods made by <span className="relative inline-block -rotate-2 rounded-base border-2 border-border bg-main px-2 text-main-foreground shadow-shadow">people</span>, not warehouses.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              Vanik brings together potters, weavers, roasters and small studios from across India — so you can shop dozens of makers and check out once.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/search?sort=newest">
                  Shop new arrivals <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/stores">Explore shops</Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t-2 border-line pt-6">
              <div>
                <dt className="text-xs text-ink-subtle">Makers</dt>
                <dd className="mt-1 font-display font-bold text-2xl">{formatNumber(stats.stores)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Products</dt>
                <dd className="mt-1 font-display font-bold text-2xl">{formatNumber(stats.products)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Avg. rating</dt>
                <dd className="mt-1 font-display font-bold text-2xl">{stats.rating.toFixed(1)}<span className="text-base text-ink-subtle">/5</span></dd>
              </div>
            </dl>
          </div>

          <div className="relative grid h-[420px] grid-cols-5 grid-rows-6 gap-3 sm:h-[520px] lg:h-[580px]">
            <Link href="/s/mitti-studio" className="group relative col-span-3 row-span-6 overflow-hidden rounded-base border-2 border-border bg-muted shadow-shadow">
              <Image
                src={unsplash("1493106641515-6b5631de4bb9", 1100, 1400)}
                alt="A potter shaping clay on a wheel"
                fill
                priority
                sizes="(min-width: 1024px) 30vw, 60vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow sm:right-auto sm:pr-5">
                <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
                  <Image src={unsplash("1610701596007-11502861dcfa", 120, 120)} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    Mitti Studio <BadgeCheck className="size-3.5 text-info" aria-label="Verified" />
                  </p>
                  <p className="text-xs text-ink-subtle">Stoneware · Puducherry</p>
                </div>
              </div>
            </Link>
            <Link href="/c/audio" className="group relative col-span-2 row-span-3 overflow-hidden rounded-base border-2 border-border bg-muted shadow-shadow">
              <Image
                src={unsplash("1545127398-14699f92334b", 700, 700)}
                alt="Beige wireless headphones"
                fill
                priority
                sizes="(min-width: 1024px) 20vw, 40vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
            </Link>
            <Link href="/c/skincare" className="group relative col-span-2 row-span-3 overflow-hidden rounded-base border-2 border-border bg-muted shadow-shadow">
              <Image
                src={unsplash("1608248597279-f99d160bfcbc", 700, 700)}
                alt="Minimal skincare bottles"
                fill
                sizes="(min-width: 1024px) 20vw, 40vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-semibold uppercase tracking-eyebrow text-on-accent">
                New in
              </span>
            </Link>
          </div>
        </div>
      </section>


      <section aria-labelledby="cat-heading" className="container-page">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="cat-heading" className="font-display font-bold text-2xl tracking-display">Shop by category</h2>
          <Link href="/search" className="group inline-flex items-center gap-1.5 text-sm font-medium">
            Browse everything <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ul className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 lg:grid-cols-10">
          {categories.map((c) => (
            <li key={c.id} className="w-28 shrink-0 snap-start sm:w-auto">
              <Link href={`/c/${c.slug}`} className="group block text-center">
                <span className="relative mx-auto block aspect-square overflow-hidden rounded-base border-2 border-border bg-muted shadow-xs transition-all group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-shadow">
                  {c.image && (
                    <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 10vw, 112px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </span>
                <span className="mt-2.5 block text-xs font-medium leading-tight text-ink sm:text-[0.8125rem]">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>


      <section className="container-page mt-20 lg:mt-28">
        <SectionHeader eyebrow="Editor’s picks" title="Made with intention" description="A rotating edit of pieces our team keeps coming back to." href="/search?sort=bestselling" />
        <ProductGrid products={featured} favorites={favs} />
      </section>


      <section className="container-page mt-20 grid gap-4 md:grid-cols-2 lg:mt-28">
        <Link href="/search?sale=1" className="group relative flex min-h-80 overflow-hidden rounded-base border-2 border-border bg-night text-white shadow-shadow lift">
          <Image
            src={unsplash("1555041469-a586c61ea9bc", 1200, 800)}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover opacity-70 transition-transform duration-[1.2s] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-tr from-black/70 via-black/30 to-transparent" />
          <div className="relative mt-auto p-7 sm:p-9">
            <p className="text-2xs font-semibold uppercase tracking-eyebrow text-white/75">Festive sale</p>
            <p className="mt-2 max-w-xs font-display font-bold text-3xl leading-tight sm:text-4xl">Up to 20% off statement pieces</p>
            <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-base border-2 border-border bg-main px-3 py-1.5 font-heading text-sm font-bold text-main-foreground shadow-xs">
              Shop the sale <ArrowRight className="size-4" />
            </span>
          </div>
        </Link>
        <Link href="/search?q=gift&max=2000" className="group relative flex min-h-80 overflow-hidden rounded-base border-2 border-border bg-main shadow-shadow lift">
          <div className="relative z-10 flex max-w-[55%] flex-col justify-end p-7 sm:p-9">
            <p className="eyebrow text-ink">The gifting edit</p>
            <p className="mt-2 font-display font-bold text-3xl leading-tight text-ink sm:text-4xl">Thoughtful gifts under ₹2,000</p>
            <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 font-heading text-sm font-bold text-ink shadow-xs">
              Find something special <ArrowRight className="size-4" />
            </span>
          </div>
          <div className="absolute inset-y-6 right-6 w-[42%] rotate-2 overflow-hidden rounded-base border-2 border-border shadow-shadow transition-transform duration-300 group-hover:rotate-0">
            <Image src={unsplash("1572726729207-a78d6feb18d7", 700, 900)} alt="" fill sizes="25vw" className="object-cover" />
          </div>
        </Link>
      </section>


      <section className="container-page mt-20 grid gap-16 lg:mt-28 lg:grid-cols-2 lg:gap-12">
        <div>
          <SectionHeader eyebrow="Trending" title="Selling fast this month" href="/search?sort=bestselling" className="mb-6" />
          <ProductGrid products={trending} favorites={favs} className="md:grid-cols-2 xl:grid-cols-2" />
        </div>
        <div>
          <SectionHeader eyebrow="Just landed" title="New arrivals" href="/search?sort=newest" className="mb-6" />
          <ProductGrid products={arrivals} favorites={favs} className="md:grid-cols-2 xl:grid-cols-2" />
        </div>
      </section>


      <section className="mt-20 border-y-2 border-line bg-surface py-20 lg:mt-28 lg:py-24">
        <div className="container-page">
          <SectionHeader eyebrow="Featured shops" title="Meet the makers" description="Every shop on Vanik is independently owned. Follow the ones you love to hear about new drops first." href="/stores" linkLabel="All shops" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        </div>
      </section>


      {sale.length > 0 && (
        <section className="container-page mt-20 lg:mt-28">
          <SectionHeader eyebrow="Limited time" title="On sale now" href="/search?sale=1" />
          <ProductGrid products={sale} favorites={favs} />
        </section>
      )}


      <section className="container-page mt-20 lg:mt-28" aria-label="Why shop on Vanik">
        <ul className="grid gap-0.5 overflow-hidden rounded-base border-2 border-border bg-line shadow-shadow sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Store, title: "One cart, many makers", body: "Shop from any number of independent shops and pay once." },
            { icon: ShieldCheck, title: "Buyer protection", body: "If an order doesn’t arrive or isn’t as described, we’ll make it right." },
            { icon: RotateCcw, title: "Easy returns & COD", body: "Most shops offer 7-day returns and cash on delivery. Policies are shown on every item." },
            { icon: Truck, title: "Tracked delivery", body: "Follow every package from the maker’s workshop to your door, anywhere in India." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="bg-secondary-background p-7">
              <span className="inline-flex size-11 items-center justify-center rounded-base border-2 border-border bg-main shadow-xs">
                <Icon className="size-5 text-main-foreground" strokeWidth={2} />
              </span>
              <h3 className="mt-4 font-heading text-base font-bold tracking-tightish">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>


      <section className="container-page mt-20 grid gap-4 lg:mt-28 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-base border-2 border-border bg-night p-8 text-white shadow-shadow sm:p-12">
          <Leaf className="absolute -right-6 -top-6 size-40 text-white/5" strokeWidth={1} aria-hidden />
          <p className="text-2xs font-semibold uppercase tracking-eyebrow text-white/60">For makers</p>
          <h2 className="mt-3 max-w-md font-display font-bold text-3xl leading-tight sm:text-4xl">Open your shop on Vanik in an afternoon.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            No listing fees. A simple 8% commission when you sell, payouts every two weeks, and tools for inventory, orders and analytics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <Link href="/sell">Start selling</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/help/selling">Read the seller handbook</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-base border-2 border-border bg-accent-soft p-8 shadow-shadow sm:p-12">
          <div>
            <p className="eyebrow">The Vanik letter</p>
            <h2 className="mt-3 font-display font-bold text-3xl leading-tight">New shops, first.</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
              A short weekly note on new makers, restocks and the occasional members-only code.
            </p>
          </div>
          <div className="mt-8">
            <NewsletterForm />
            <div className="mt-5 flex items-center gap-3 text-xs text-ink-subtle">
              <Rating value={stats.rating} size="xs" />
              {formatNumber(stats.reviews)} reviews from shoppers
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
