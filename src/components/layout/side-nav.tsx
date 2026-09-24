"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BarChart3,
  Boxes,
  CreditCard,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  MessageSquareText,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  orders: Package,
  wishlist: Heart,
  reviews: Star,
  addresses: MapPin,
  payments: CreditCard,
  notifications: Bell,
  profile: User,
  analytics: BarChart3,
  products: Tag,
  inventory: Boxes,
  vendorOrders: ShoppingCart,
  customers: Users,
  vendorReviews: MessageSquareText,
  payouts: Wallet,
  shipping: Truck,
  settings: Settings,
  support: LifeBuoy,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS | string; badge?: number; exact?: boolean };
export type NavSection = { title?: string; items: NavItem[] };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SideNav({ sections, className }: { sections: NavSection[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Section" className={className}>
      {sections.map((sec, si) => (
        <div key={si} className={cn(si > 0 && "mt-6")}>
          {sec.title && <p className="eyebrow mb-2 px-3">{sec.title}</p>}
          <ul className="space-y-0.5">
            {sec.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                      active ? "border-2 border-border bg-main font-bold text-main-foreground shadow-xs" : "border-2 border-transparent text-ink-muted hover:border-border hover:bg-secondary-background hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-[1.125rem] shrink-0", active ? "text-main-foreground" : "text-ink-subtle group-hover:text-ink")} strokeWidth={2} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {!!item.badge && (
                      <span className="rounded-base border-2 border-border bg-accent px-1.5 text-2xs font-bold tabular-nums text-on-accent">{item.badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function MobileTabs({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const items = sections.flatMap((s) => s.items);
  return (
    <nav aria-label="Section" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm transition-colors",
              active ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong text-ink-muted hover:border-ink/40 hover:text-ink",
            )}
          >
            {item.label}
            {!!item.badge && <span className={cn("text-2xs font-semibold", active ? "text-ink-inverse/80" : "text-accent")}>{item.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
