import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ClipboardList,
  Info,
  Leaf,
  MapPinned,
  PackageOpen,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { firstParam, unsplash } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/shop/faq";

export const metadata: Metadata = {
  title: "Sell on Vanik",
  description: "Open your shop on Vanik. No listing fees, an 8% commission when you sell, and payouts every 14 days.",
};

const STEPS = [
  {
    title: "Create your seller account",
    body: "Sign up as a seller, name your shop and tell buyers the story behind your work. It takes about ten minutes.",
  },
  {
    title: "List your products",
    body: "Add photos, variants, stock levels and shipping zones. Set your own prices and your own return policy.",
  },
  {
    title: "Sell and get paid",
    body: "Buyers check out alongside other shops in one cart. You fulfil your items and get paid every 14 days.",
  },
];

const FEATURES = [
  { icon: BarChart3, title: "Sales analytics", body: "Revenue, orders, average order value and best sellers over time, at a glance." },
  { icon: Bell, title: "Inventory & low-stock alerts", body: "Stock per variant, updated with every sale, and a heads-up before anything sells out." },
  { icon: ClipboardList, title: "Order management", body: "See only your items, move orders from confirmed to delivered, and add tracking." },
  { icon: Wallet, title: "Payouts every 2 weeks", body: "A clear balance, the orders each payout covers, and money on a predictable schedule." },
  { icon: MapPinned, title: "Shipping zones", body: "Set rates by region and free-shipping thresholds. Buyers see exact costs before paying." },
  { icon: Star, title: "Reviews", body: "Verified-purchase reviews on every product, with public replies from you." },
];

const FAQ = [
  {
    q: "Do I need a separate account to sell?",
    a: "No. If you already shop on Vanik, upgrade your existing account to a seller account from this page — you keep your orders, wishlist and saved details, and get the vendor dashboard on top.",
  },
  {
    q: "What does it cost?",
    a: "Nothing to list and no monthly fee. When you make a sale we take an 8% commission on the item price and shipping. Each payout has a flat ₹10 fee.",
  },
  {
    q: "When and how do I get paid?",
    a: "Payouts are sent every 14 days and include earnings from orders delivered before the payout date, less commission and refunds. In this demo, payouts are simulated.",
  },
  {
    q: "Who handles shipping and returns?",
    a: "You do. You ship your items directly to the buyer, using the shipping zones and rates you set, and handle returns under your own published return policy.",
  },
  {
    q: "What can I sell?",
    a: "Things you make, design or curate yourself: ceramics, apparel, homeware, beauty, small-batch food, tech accessories and more. Counterfeit, illegal or unsafe goods are not allowed.",
  },
  {
    q: "Can I sell alongside my own website?",
    a: "Absolutely. Many makers use Vanik to reach new buyers while keeping their own site. There is no exclusivity.",
  },
];

export default async function SellPage(props: PageProps<"/sell">) {
  const sp = await props.searchParams;
  const notVendor = firstParam(sp.reason) === "not-vendor";
  const user = await getSessionUser();
  const cta =
    user?.role === "vendor"
      ? { href: "/vendor", label: "Go to your seller dashboard" }
      : user
        ? { href: "/vendor/onboarding", label: "Upgrade to a seller account" }
        : { href: "/sign-up?role=vendor", label: "Open your shop" };

  return (
    <>
      {notVendor && (
        <div className="container-page pt-6">
          <div role="status" className="flex flex-col gap-3 rounded-lg border-2 border-info/20 bg-info-soft px-5 py-4 text-sm text-info sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Your account is set up for shopping.{" "}
                {user ? "Upgrade it to a seller account to access the vendor dashboard — you keep your shopping account." : "Create a seller account to access the vendor dashboard."}
              </span>
            </p>
            <Link
              href={cta.href}
              className="inline-flex shrink-0 items-center gap-1.5 pl-6 font-medium underline decoration-info/40 underline-offset-4 hover:decoration-info sm:pl-0"
            >
              {user ? cta.label : "Create seller account"} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}


      <section className="container-page grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-16">
        <div className="max-w-xl animate-slide-up">
          <p className="eyebrow mb-5 inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" /> For makers and small brands
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-display text-ink sm:text-6xl">
            Sell your work to people who <em className="font-normal italic text-accent">care</em> who made it.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
            Open a shop on Vanik and sit alongside hundreds of independent makers. Buyers discover you, check out once, and you keep control of everything else.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={cta.href}>
                {cta.label} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/help/selling">Read the seller handbook</Link>
            </Button>
          </div>
          <ul className="mt-10 grid gap-2.5 text-sm text-ink-muted sm:grid-cols-2">
            {["No listing or monthly fees", "8% commission only when you sell", "Payouts every 14 days", "Your prices, your policies"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 text-success" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-muted sm:aspect-5/4 lg:aspect-4/5">
            <Image
              src={unsplash("1452860606245-08befc0ff44b", 1100, 1300)}
              alt="A maker's workbench with hand tools laid out on a wooden table"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 rounded-xl border-2 border-line bg-surface p-4 shadow-lg sm:left-auto sm:right-6 sm:w-72">
            <p className="eyebrow">This payout</p>
            <p className="mt-1.5 font-display font-bold text-3xl tracking-display">₹1,86,420</p>
            <p className="mt-1 text-xs text-ink-subtle">38 orders · paid in 6 days</p>
            <div className="mt-3 flex h-10 items-end gap-1" aria-hidden>
              {[40, 55, 35, 70, 60, 85, 75, 95].map((h, i) => (
                <span key={i} className="flex-1 rounded-sm bg-accent/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>


      <section aria-labelledby="how-heading" className="mt-10 border-y-2 border-line bg-surface py-20 lg:py-24">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow mb-2.5">How it works</p>
            <h2 id="how-heading" className="font-display font-bold text-3xl tracking-display sm:text-4xl">From workbench to storefront in an afternoon</h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative border-t-2 border-line-strong pt-6">
                <span className="font-display text-5xl font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-lg font-semibold tracking-tightish">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>


      <section className="container-page mt-20 lg:mt-28" aria-labelledby="features-heading">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow mb-2.5">What you get</p>
          <h2 id="features-heading" className="font-display font-bold text-3xl tracking-display sm:text-4xl">A dashboard built for small shops</h2>
          <p className="mt-2.5 text-base text-ink-muted">Everything you need to run your shop, and nothing you don&rsquo;t.</p>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border-2 border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="bg-surface p-7">
              <Icon className="size-6 text-accent" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-base font-semibold tracking-tightish">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>


      <section className="container-page mt-20 lg:mt-28" aria-labelledby="pricing-heading">
        <div className="grid gap-10 rounded-2xl border-2 border-line bg-surface p-8 sm:p-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-2.5">Pricing</p>
            <h2 id="pricing-heading" className="font-display font-bold text-3xl tracking-display sm:text-4xl">Simple, and only when you sell</h2>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-muted">
              No subscriptions, no listing fees, no surprises. You pay a small commission on what you sell, and that&rsquo;s it.
            </p>
            <Button asChild variant="link" className="mt-6">
              <Link href="/help/fees">How fees and payouts work</Link>
            </Button>
          </div>
          <dl className="grid gap-px overflow-hidden rounded-xl border-2 border-line bg-line sm:grid-cols-3">
            {[
              { k: "Listing fees", v: "₹0", note: "List as many products as you like" },
              { k: "Commission", v: "8%", note: "On item price and shipping, per sale" },
              { k: "Per payout", v: "₹10", note: "Paid out every 14 days" },
            ].map((p) => (
              <div key={p.k} className="flex flex-col bg-canvas p-6">
                <dt className="text-xs font-medium text-ink-subtle">{p.k}</dt>
                <dd className="mt-3 font-display font-bold text-4xl tracking-display text-ink">{p.v}</dd>
                <dd className="mt-2 text-xs leading-relaxed text-ink-muted">{p.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>


      <section className="container-page mt-20 lg:mt-28" aria-label="What sellers say">
        <figure className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
            <Image
              src={unsplash("1493106641515-6b5631de4bb9", 1000, 750)}
              alt="Hands shaping clay on a potter's wheel"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <blockquote className="font-display text-2xl font-bold leading-snug tracking-display text-ink sm:text-3xl">
              &ldquo;I used to spend my evenings answering the same shipping questions. Now buyers see my rates, my return policy and their tracking without asking. I just make things and pack boxes.&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink" aria-hidden>
                <Store className="size-4" />
              </span>
              <span>
                <span className="block font-semibold text-ink">Maya Okafor</span>
                <span className="text-ink-subtle">Mitti Studio · Puducherry</span>
              </span>
            </figcaption>
          </div>
        </figure>
      </section>


      <section className="container-page mt-20 grid gap-10 lg:mt-28 lg:grid-cols-[1fr_2fr] lg:gap-16" aria-labelledby="faq-heading">
        <div>
          <p className="eyebrow mb-2.5">FAQ</p>
          <h2 id="faq-heading" className="font-display font-bold text-3xl tracking-display sm:text-4xl">Questions from makers</h2>
          <p className="mt-3 text-sm text-ink-muted">
            More in the{" "}
            <Link href="/help/selling" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              seller handbook
            </Link>
            .
          </p>
        </div>
        <FaqList items={FAQ} />
      </section>


      <section className="container-page mt-20 lg:mt-28">
        <div className="relative overflow-hidden rounded-2xl bg-night p-8 text-white sm:p-12 lg:p-16">
          <Leaf className="absolute -right-6 -top-6 size-48 text-white/5" strokeWidth={1} aria-hidden />
          <PackageOpen className="size-8 text-white/60" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-5 max-w-xl font-display font-bold text-3xl leading-tight tracking-display sm:text-4xl">Your shop could be live by tonight.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Set up is free, and you only pay when you make a sale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href={cta.href}>
                {cta.label} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/help/fees">See fees & payouts</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
