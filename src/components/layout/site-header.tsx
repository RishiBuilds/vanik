import { Suspense } from "react";
import Link from "next/link";
import { Bell, Heart, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getCartCount } from "@/lib/queries/cart";
import { getCategoryTree } from "@/lib/queries/catalog";
import { getUnreadCount } from "@/lib/queries/notifications";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { AccountMenu } from "./account-menu";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { CategoryNav } from "./category-nav";

function IconLink({ href, label, children, badge }: { href: string; label: string; children: React.ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      className="relative inline-flex size-10 items-center justify-center rounded-base border-2 border-transparent text-ink transition-colors hover:border-border hover:bg-main"
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
    >
      {children}
      {!!badge && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-base border-2 border-border bg-accent px-1 text-2xs font-bold tabular-nums text-on-accent">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getSessionUser();
  const [cartCount, unread, categories] = await Promise.all([
    getCartCount(),
    user ? getUnreadCount(user.id) : Promise.resolve(0),
    getCategoryTree(),
  ]);

  return (
    <>
      <div className="overflow-hidden border-b-2 border-border bg-main text-main-foreground">
        <p className="sr-only">Free delivery above ₹999 from most shops. Cash on delivery available. New here? Use WELCOME10 for 10% off.</p>
        <div className="flex h-9 w-max animate-marquee items-center font-heading text-xs font-bold uppercase tracking-wide" aria-hidden>
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {["Free delivery above ₹999", "Cash on delivery available", "New here? Use WELCOME10 for 10% off", "UPI · RuPay · Net banking", "11 independent Indian makers", "7-day easy returns"].map((t) => (
                <span key={t} className="flex items-center gap-6 px-6">
                  {t} <span className="text-base leading-none">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b-2 border-border bg-canvas">
        <div className="container-page flex h-16 items-center gap-3 lg:h-[4.5rem] lg:gap-6">
          <MobileNav user={user} categories={categories} />
          <Logo className="shrink-0" />
          <Suspense fallback={<div className="hidden h-11 flex-1 rounded-base border-2 border-border bg-secondary-background md:block" />}>
            <SearchBox className="mx-auto hidden max-w-xl flex-1 md:block" />
          </Suspense>
          <nav aria-label="Account" className="ml-auto flex items-center gap-0.5 md:ml-0">
            {user?.role === "vendor" ? (
              <Button asChild variant="outline" size="sm" className="mr-1.5 hidden lg:inline-flex">
                <Link href="/vendor">
                  <LayoutDashboard /> Dashboard
                </Link>
              </Button>
            ) : (
              <Link
                href="/sell"
                className="mr-2 hidden rounded-base border-2 border-transparent px-2 py-1 font-heading text-sm font-bold text-ink transition-colors hover:border-border hover:bg-main lg:inline-block"
              >
                Sell on Vanik
              </Link>
            )}
            <ThemeToggle className="hidden sm:inline-flex" />
            {user && (
              <IconLink href="/account/notifications" label="Notifications" badge={unread}>
                <Bell className="size-5" strokeWidth={1.75} />
              </IconLink>
            )}
            <span className="hidden sm:contents">
              <IconLink href={user ? "/account/wishlist" : "/sign-in?next=/account/wishlist"} label="Wishlist">
                <Heart className="size-5" strokeWidth={1.75} />
              </IconLink>
            </span>
            {user ? (
              <AccountMenu user={user} />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <span className="contents sm:hidden">
                  <IconLink href="/sign-in" label="Sign in">
                    <User className="size-5" strokeWidth={1.75} />
                  </IconLink>
                </span>
              </>
            )}
            <IconLink href="/cart" label="Cart" badge={cartCount}>
              <ShoppingBag className="size-5" strokeWidth={1.75} />
            </IconLink>
          </nav>
        </div>
        <div className="container-page pb-3 md:hidden">
          <Suspense fallback={<div className="h-11 rounded-base border-2 border-border bg-secondary-background" />}>
            <SearchBox />
          </Suspense>
        </div>
        <CategoryNav categories={categories} />
      </header>
    </>
  );
}
