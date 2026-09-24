"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Heart, LayoutDashboard, LogOut, MapPin, Package, Settings, Star, Store } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/session";
import { Avatar } from "@/components/ui/misc";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";

export function AccountMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <Dropdown>
      <DropdownTrigger
        className="ml-1 inline-flex size-10 items-center justify-center rounded-full transition-shadow hover:ring-4 hover:ring-muted data-[state=open]:ring-4 data-[state=open]:ring-muted"
        aria-label="Account menu"
      >
        <Avatar src={user.image} name={user.name} size={32} />
      </DropdownTrigger>
      <DropdownContent className="w-64">
        <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
          <Avatar src={user.image} name={user.name} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-ink-subtle">{user.email}</p>
          </div>
        </div>
        <DropdownSeparator />
        {user.role === "vendor" && (
          <>
            <DropdownLabel>Selling</DropdownLabel>
            <DropdownItem asChild>
              <Link href="/vendor">
                <LayoutDashboard /> Vendor dashboard
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/vendor/settings">
                <Store /> Store settings
              </Link>
            </DropdownItem>
            <DropdownSeparator />
            <DropdownLabel>Shopping</DropdownLabel>
          </>
        )}
        <DropdownItem asChild>
          <Link href="/account/orders">
            <Package /> Orders
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/wishlist">
            <Heart /> Wishlist
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/reviews">
            <Star /> Reviews
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/addresses">
            <MapPin /> Addresses
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/notifications">
            <Bell /> Notifications
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/profile">
            <Settings /> Account settings
          </Link>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
