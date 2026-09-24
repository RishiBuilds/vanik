import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HandHeart, Scale, Sprout } from "lucide-react";
import { getMarketplaceStats } from "@/lib/queries/stores";
import { formatNumber, unsplash } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Vanik",
  description: "Vanik is a marketplace for independent makers and small brands. Many shops, one cart, one checkout.",
};

const VALUES = [
  {
    icon: HandHeart,
    title: "Makers first",
    body: "Every shop is independently owned. Sellers set their own prices, policies and pace, and keep their name on everything they make.",
  },
  {
    icon: Scale,
    title: "Fair and simple",
    body: "No listing fees, no pay-to-rank. One flat 8% commission when something sells, and payouts on a predictable 14-day schedule.",
  },
  {
    icon: Sprout,
    title: "Made to last",
    body: "We favour things built with care over things built for a season: fewer, better goods, with the story of who made them.",
  },
];

export default async function AboutPage() {
  const stats = await getMarketplaceStats();

  return (
    <>

      <section className="container-page pt-12 lg:pt-20">
        <p className="eyebrow mb-5">About Vanik</p>
        <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.04] tracking-display sm:text-6xl">
          A market square for the people who <em className="font-normal italic text-accent">make</em> things.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Vanik comes from the word for a trader, the merchant at a stall in the market. We built it to give independent makers the reach of a big store without asking them to become one.
        </p>
      </section>


      <section className="container-page mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16">
        <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-muted">
          <Image
            src={unsplash("1441986300917-64674bd600d8", 1400, 875)}
            alt="The interior of a small independent shop with goods on shelves"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="lg:pb-4">
          <h2 className="font-display font-bold text-3xl tracking-display sm:text-4xl">Our mission</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-muted">
            <p>
              Buying from small shops used to mean a dozen websites, a dozen checkouts and a dozen shipping fees you only discovered at the end. Selling as a small shop meant building all of that yourself.
            </p>
            <p>
              Vanik puts hundreds of independent shops behind one cart. Shoppers pay once. Each maker ships their own work, sets their own policies, and gets paid on time.
            </p>
          </div>
        </div>
      </section>


      <section className="container-page mt-20 lg:mt-28" aria-labelledby="values-heading">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow mb-2.5">What we believe</p>
          <h2 id="values-heading" className="font-display font-bold text-3xl tracking-display sm:text-4xl">Three things we won&rsquo;t compromise on</h2>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border-2 border-line bg-line md:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="bg-surface p-8">
              <Icon className="size-6 text-accent" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-5 text-lg font-semibold tracking-tightish">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>


      <section className="mt-20 border-y-2 border-line bg-surface py-16 lg:mt-28 lg:py-20" aria-labelledby="numbers-heading">
        <div className="container-page">
          <h2 id="numbers-heading" className="eyebrow mb-8">Vanik in numbers</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {[
              { k: "Independent shops", v: formatNumber(stats.stores) },
              { k: "Products listed", v: formatNumber(stats.products) },
              { k: "Shopper reviews", v: formatNumber(stats.reviews) },
              { k: "Average rating", v: `${(stats.rating || 0).toFixed(1)} / 5` },
            ].map((n) => (
              <div key={n.k} className="border-t-2 border-line-strong pt-5">
                <dt className="text-sm text-ink-subtle">{n.k}</dt>
                <dd className="mt-2 font-display text-4xl font-bold tracking-display sm:text-5xl">{n.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 max-w-xl text-xs text-ink-subtle">
            Vanik is a demo marketplace. Figures reflect the sample catalogue; no real orders are fulfilled.
          </p>
        </div>
      </section>


      <section className="container-page mt-20 grid gap-4 lg:mt-28 md:grid-cols-2">
        <Link href="/stores" className="group relative flex min-h-72 overflow-hidden rounded-2xl bg-night text-white">
          <Image
            src={unsplash("1534452203293-494d7ddbf7e0", 1000, 700)}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover opacity-60 transition-transform duration-[1.2s] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-tr from-black/70 via-black/30 to-transparent" />
          <div className="relative mt-auto p-7 sm:p-9">
            <p className="text-2xs font-semibold uppercase tracking-eyebrow text-white/75">For shoppers</p>
            <p className="mt-2 font-display font-bold text-3xl leading-tight">Meet the makers</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
              Explore shops <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </Link>
        <div className="flex flex-col justify-between rounded-2xl border-2 border-line bg-accent-soft p-7 sm:p-9">
          <div>
            <p className="eyebrow text-accent-ink">For makers</p>
            <p className="mt-2 max-w-sm font-display font-bold text-3xl leading-tight text-ink">Bring your shop to Vanik.</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">No listing fees, 8% when you sell, and payouts every 14 days.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/sell">Start selling</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/help">Visit the help center</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
