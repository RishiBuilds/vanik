import Link from "next/link";
import { ArrowUpRight, Bell, ShoppingBag } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getVendorBadgeCounts } from "@/lib/queries/vendor-shell";
import { Logo } from "@/components/layout/logo";
import { SideNav, type NavSection } from "@/components/layout/side-nav";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { StoreLogo } from "@/components/shop/store-card";
import { VendorMobileNav } from "@/components/vendor/mobile-nav";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, store } = await requireVendor();
  const [counts, unread] = await Promise.all([getVendorBadgeCounts(store.id), getUnreadCount(user.id)]);

  const sections: NavSection[] = [
    {
      items: [
        { href: "/vendor", label: "Overview", icon: "analytics", exact: true },
        { href: "/vendor/orders", label: "Orders", icon: "vendorOrders", badge: counts.orders },
        { href: "/vendor/products", label: "Products", icon: "products" },
        { href: "/vendor/inventory", label: "Inventory", icon: "inventory", badge: counts.lowStock },
        { href: "/vendor/customers", label: "Customers", icon: "customers" },
        { href: "/vendor/reviews", label: "Reviews", icon: "vendorReviews", badge: counts.reviews },
      ],
    },
    {
      title: "Store",
      items: [
        { href: "/vendor/payouts", label: "Payouts", icon: "payouts" },
        { href: "/vendor/shipping", label: "Shipping", icon: "shipping" },
        { href: "/vendor/settings", label: "Settings", icon: "settings" },
        { href: "/vendor/support", label: "Help & support", icon: "support" },
      ],
    },
  ];

  const storeCard = (
    <div className="rounded-lg border-2 border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <StoreLogo src={store.logo} name={store.name} size={36} className="ring-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{store.name}</p>
          <p className="truncate text-xs text-ink-subtle">{store.status === "active" ? "Live" : "Paused"} · {store.location || "Online"}</p>
        </div>
      </div>
      <Link
        href={`/s/${store.slug}`}
        className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-md border-2 border-line text-xs font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        View storefront <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] print:block">
      <aside className="hidden border-r-2 border-line bg-canvas lg:block print:hidden">
        <div className="sticky top-0 flex h-dvh flex-col px-4 py-5">
          <Logo className="px-2" suffix="Seller" />
          <div className="mt-6">{storeCard}</div>
          <div className="mt-6 flex-1 overflow-y-auto">
            <SideNav sections={sections} />
          </div>
          <Link href="/" className="mt-4 flex h-10 items-center gap-3 rounded-md px-3 text-sm text-ink-muted transition-colors hover:bg-muted hover:text-ink">
            <ShoppingBag className="size-[1.125rem] text-ink-subtle" strokeWidth={1.75} /> Switch to shopping
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 print:hidden items-center gap-3 border-b-2 border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <VendorMobileNav sections={sections} storeCard={storeCard} />
          <Logo className="lg:hidden" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/vendor/notifications"
              className="relative inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-muted"
              aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
            >
              <Bell className="size-5" strokeWidth={1.75} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-2xs font-semibold text-on-accent ring-2 ring-canvas">
                  {unread}
                </span>
              )}
            </Link>
            <AccountMenu user={user} />
          </div>
        </header>
        <main id="main" className="w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
