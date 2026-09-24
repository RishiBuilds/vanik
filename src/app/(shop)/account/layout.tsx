import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUnreadCount } from "@/lib/queries/notifications";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { MobileTabs, SideNav, type NavSection } from "@/components/layout/side-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const unread = await getUnreadCount(user.id);
  const sections: NavSection[] = [
    {
      items: [
        { href: "/account", label: "Overview", icon: "overview", exact: true },
        { href: "/account/orders", label: "Orders", icon: "orders" },
        { href: "/account/wishlist", label: "Wishlist", icon: "wishlist" },
        { href: "/account/reviews", label: "Reviews", icon: "reviews" },
      ],
    },
    {
      title: "Settings",
      items: [
        { href: "/account/profile", label: "Profile", icon: "profile" },
        { href: "/account/addresses", label: "Addresses", icon: "addresses" },
        { href: "/account/payments", label: "Payment methods", icon: "payments" },
        { href: "/account/notifications", label: "Notifications", icon: "notifications", badge: unread },
      ],
    },
  ];

  return (
    <div className="container-page pt-8 lg:pt-10">
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <div className="mb-6 flex items-center gap-3 px-3">
              <Avatar src={user.image} name={user.name} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-ink-subtle">{user.email}</p>
              </div>
            </div>
            <SideNav sections={sections} />
            {user.role === "vendor" && (
              <Button asChild variant="outline" size="sm" block className="mt-6">
                <Link href="/vendor">
                  <LayoutDashboard /> Switch to vendor dashboard
                </Link>
              </Button>
            )}
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-6 lg:hidden">
            <MobileTabs sections={sections} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
