import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, ShoppingBag, Store, Truck } from "lucide-react";
import { getCart } from "@/lib/queries/cart";
import { getTrendingProducts } from "@/lib/queries/catalog";
import { getMyFavoriteIds } from "@/lib/queries/account";
import { getSessionUser } from "@/lib/session";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/misc";
import { ProductGrid } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/shop/section";
import { CartLineItem } from "@/components/cart/cart-line";
import { PromoForm } from "@/components/cart/promo-form";
import { SummaryRows } from "@/components/cart/order-summary";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getSessionUser()]);
  const empty = cart.groups.length === 0;

  if (empty) {
    const [trending, favs] = await Promise.all([getTrendingProducts(4), getMyFavoriteIds()]);
    return (
      <div className="container-page pt-10">
        <h1 className="font-display font-bold text-4xl tracking-display sm:text-5xl">Your cart</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description={cart.saved.length ? "You have items saved for later below." : "Find something you love from one of our independent shops."}
          action={
            <>
              <Button asChild>
                <Link href="/search?sort=bestselling">Shop bestsellers</Link>
              </Button>
              {!user && (
                <Button asChild variant="outline">
                  <Link href="/sign-in?next=/cart">Sign in to see your cart</Link>
                </Button>
              )}
            </>
          }
          className="mt-8 rounded-2xl border-2 border-line bg-surface"
        />
        {cart.saved.length > 0 && <SavedList lines={cart.saved} />}
        <section className="mt-20">
          <SectionHeader title="Popular right now" href="/search?sort=bestselling" />
          <ProductGrid products={trending} favorites={favs} />
        </section>
      </div>
    );
  }

  return (
    <div className="container-page pt-8 lg:pt-10">
      <h1 className="font-display font-bold text-4xl tracking-display sm:text-5xl">Your cart</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {cart.count} item{cart.count === 1 ? "" : "s"} from {cart.groups.length} shop{cart.groups.length === 1 ? "" : "s"} · each shop ships separately
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <div className="space-y-5">
          {cart.groups.map((g) => {
            const remaining = g.freeShippingThreshold != null ? g.freeShippingThreshold - g.subtotal : null;
            return (
              <section key={g.store.id} className="rounded-xl border-2 border-line bg-surface" aria-label={`Items from ${g.store.name}`}>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line px-5 py-4 sm:px-6">
                  <Link href={`/s/${g.store.slug}`} className="flex items-center gap-2 text-sm font-semibold hover:underline hover:underline-offset-4">
                    <Store className="size-4 text-ink-subtle" /> {g.store.name}
                  </Link>
                  <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                    <Truck className="size-3.5" />
                    {g.rates[0]!.price === 0 ? "Free standard shipping" : `${g.rates[0]!.name} from ${formatMoney(g.rates[0]!.price)}`}
                  </span>
                </header>
                {remaining != null && (
                  <div className="border-b-2 border-line px-5 py-3 sm:px-6">
                    <p className="text-xs text-ink-muted">
                      {remaining > 0 ? (
                        <>
                          Add <span className="font-semibold text-ink">{formatMoney(remaining)}</span> more from {g.store.name} for free shipping
                        </>
                      ) : (
                        <span className="font-medium text-success">You’ve unlocked free shipping from {g.store.name}</span>
                      )}
                    </p>
                    <ProgressBar value={g.subtotal / g.freeShippingThreshold!} tone={remaining > 0 ? "accent" : "success"} className="mt-2" />
                  </div>
                )}
                <ul className="divide-y divide-line px-5 sm:px-6">
                  {g.lines.map((l) => (
                    <CartLineItem key={l.id} line={l} />
                  ))}
                </ul>
              </section>
            );
          })}
          {cart.saved.length > 0 && <SavedList lines={cart.saved} />}
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-xl border-2 border-line bg-surface p-5 sm:p-6">
            <h2 className="text-base font-semibold">Order summary</h2>
            <SummaryRows totals={cart.totals} shippingLabel="Estimated shipping" itemCount={cart.count} className="mt-5" />
            <div className="mt-6">
              <PromoForm applied={cart.promo ? { code: cart.promo.code, description: cart.promo.description } : null} />
            </div>
            <div className="mt-6">
              {cart.hasUnavailable ? (
                <Button block size="lg" disabled>
                  Resolve unavailable items to continue
                </Button>
              ) : user ? (
                <Button asChild block size="lg">
                  <Link href="/checkout">
                    <Lock /> Checkout <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild block size="lg">
                    <Link href="/sign-in?next=/checkout">Sign in to check out</Link>
                  </Button>
                  <p className="mt-2 text-center text-xs text-ink-subtle">Your cart will be saved to your account.</p>
                </>
              )}
            </div>
            <ul className="mt-6 space-y-2.5 border-t-2 border-line pt-5 text-xs text-ink-muted">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-ink-subtle" /> Vanik buyer protection on every order
              </li>
              <li className="flex items-center gap-2">
                <Lock className="size-4 text-ink-subtle" /> Secure, encrypted checkout
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SavedList({ lines }: { lines: Awaited<ReturnType<typeof getCart>>["saved"] }) {
  return (
    <section className="mt-10 rounded-xl border-2 border-dashed border-line-strong px-5 sm:px-6" aria-label="Saved for later">
      <h2 className="pt-5 text-sm font-semibold">
        Saved for later <span className="font-normal text-ink-subtle">({lines.length})</span>
      </h2>
      <ul className="divide-y divide-line">
        {lines.map((l) => (
          <CartLineItem key={l.id} line={l} saved />
        ))}
      </ul>
    </section>
  );
}
