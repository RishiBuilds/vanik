import Link from "next/link";
import { getCategoryTree } from "@/lib/queries/catalog";
import { Logo } from "./logo";
import { NewsletterForm } from "@/components/shop/newsletter-form";

export async function SiteFooter() {
  const categories = await getCategoryTree();
  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    { title: "Shop", links: [...categories.slice(0, 6).map((c) => ({ href: `/c/${c.slug}`, label: c.name })), { href: "/stores", label: "All shops" }, { href: "/search?sale=1", label: "Sale" }] },
    {
      title: "Your account",
      links: [
        { href: "/account", label: "Account overview" },
        { href: "/account/orders", label: "Orders & tracking" },
        { href: "/account/wishlist", label: "Wishlist" },
        { href: "/cart", label: "Cart" },
      ],
    },
    {
      title: "Sell",
      links: [
        { href: "/sell", label: "Sell on Vanik" },
        { href: "/vendor", label: "Vendor dashboard" },
        { href: "/help/selling", label: "Seller handbook" },
        { href: "/help/fees", label: "Fees & payouts" },
      ],
    },
    {
      title: "Help",
      links: [
        { href: "/help", label: "Help center" },
        { href: "/help/shipping", label: "Shipping" },
        { href: "/help/returns", label: "Returns & refunds" },
        { href: "/about", label: "About Vanik" },
      ],
    },
  ];
  return (
    <footer className="mt-24 border-t-2 border-line bg-surface">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.3fr_2.7fr] lg:gap-16 lg:py-16">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            A marketplace for independent makers and small brands. Hundreds of shops, one cart, one checkout.
          </p>
          <div className="mt-7">
            <p className="text-sm font-medium">Get new-shop drops in your inbox</p>
            <p className="mt-1 text-xs text-ink-subtle">One email a week. Unsubscribe anytime.</p>
            <NewsletterForm className="mt-3" compact />
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t-2 border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getUTCFullYear()} Vanik Marketplace Pvt. Ltd. A demo storefront — no real orders are fulfilled.</p>
          <div className="flex gap-5">
            <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/help" className="hover:text-ink">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
