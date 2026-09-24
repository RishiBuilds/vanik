"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Menu, Package, Store, Tag, User } from "lucide-react";
import type { CategoryNode } from "@/lib/queries/catalog";
import type { SessionUser } from "@/lib/session";
import { authClient } from "@/lib/auth-client";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcn/accordion";
import { Avatar } from "@/components/ui/misc";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav({ user, categories }: { user: SessionUser | null; categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const close = () => setOpen(false);
  const linkCls = "flex items-center gap-3 rounded-base border-2 border-transparent px-3 py-2.5 font-heading text-sm font-bold text-ink hover:border-border hover:bg-main [&_svg]:size-[1.125rem]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="-ml-2 inline-flex size-10 items-center justify-center rounded-base border-2 border-transparent hover:border-border hover:bg-main lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </DialogTrigger>
      <SheetContent
        title="Menu"
        side="left"
        footer={
          user ? (
            <Button
              variant="outline"
              block
              onClick={async () => {
                await authClient.signOut();
                close();
                router.push("/");
                router.refresh();
              }}
            >
              <LogOut /> Sign out
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" onClick={close}>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild onClick={close}>
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          )
        }
      >
        <div className="p-3">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background px-3 py-3 shadow-xs">
              <Avatar src={user.image} name={user.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-ink-subtle">{user.email}</p>
              </div>
              <ThemeToggle />
            </div>
          )}
          <p className="eyebrow px-3 pb-2 pt-2">Shop by category</p>
          <Accordion type="single" collapsible className="px-1">
            {categories.map((cat) => (
              <AccordionItem key={cat.id} value={cat.id} className="border-b-0">
                <AccordionTrigger className="rounded-base border-2 border-transparent px-3 py-2.5 hover:border-border hover:bg-main hover:no-underline">
                  {cat.name}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="mb-2 ml-3 border-l-2 border-border pl-2">
                    <li>
                      <Link href={`/c/${cat.slug}`} onClick={close} className="block rounded-base px-3 py-2 font-heading text-sm font-bold text-accent hover:bg-muted">
                        Shop all
                      </Link>
                    </li>
                    {cat.children.map((ch) => (
                      <li key={ch.id}>
                        <Link href={`/c/${ch.slug}`} onClick={close} className="block rounded-base px-3 py-2 text-sm text-ink-muted hover:bg-muted hover:text-ink">
                          {ch.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="my-3 h-0.5 bg-border" />
          <Link href="/stores" onClick={close} className={linkCls}>
            <Store /> All shops
          </Link>
          <Link href="/search?sale=1" onClick={close} className={linkCls}>
            <Tag /> Sale
          </Link>
          <div className="my-3 h-0.5 bg-border" />
          {user ? (
            <>
              {user.role === "vendor" && (
                <Link href="/vendor" onClick={close} className={linkCls}>
                  <LayoutDashboard /> Vendor dashboard
                </Link>
              )}
              <Link href="/account" onClick={close} className={linkCls}>
                <User /> My account
              </Link>
              <Link href="/account/orders" onClick={close} className={linkCls}>
                <Package /> Orders
              </Link>
              <Link href="/account/wishlist" onClick={close} className={linkCls}>
                <Heart /> Wishlist
              </Link>
            </>
          ) : (
            <Link href="/sell" onClick={close} className={linkCls}>
              <Store /> Sell on Vanik
            </Link>
          )}
          {!user && (
            <div className="mt-2 flex items-center justify-between px-3 text-sm text-ink-muted">
              Theme <ThemeToggle />
            </div>
          )}
        </div>
      </SheetContent>
    </Dialog>
  );
}
