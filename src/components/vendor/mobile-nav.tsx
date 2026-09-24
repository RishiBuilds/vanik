"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { SideNav, type NavSection } from "@/components/layout/side-nav";

export function VendorMobileNav({ sections, storeCard }: { sections: NavSection[]; storeCard: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="-ml-2 inline-flex size-10 items-center justify-center rounded-md hover:bg-muted lg:hidden" aria-label="Open navigation">
        <Menu className="size-5" />
      </DialogTrigger>
      <SheetContent title="Seller dashboard" side="left">

        <div className="space-y-6 p-4" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {storeCard}
          <SideNav sections={sections} />
          <Link href="/" className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-ink-muted hover:bg-muted hover:text-ink">
            <ShoppingBag className="size-[1.125rem] text-ink-subtle" /> Switch to shopping
          </Link>
        </div>
      </SheetContent>
    </Dialog>
  );
}
