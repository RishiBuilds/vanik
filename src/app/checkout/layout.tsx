import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-line bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Back to cart</span>
          </Link>
          <Logo />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <Lock className="size-3.5" /> <span className="hidden sm:inline">Secure checkout</span>
          </span>
        </div>
      </header>
      <main id="main" className="container-page pb-20 pt-8 lg:pt-12">
        {children}
      </main>
    </div>
  );
}
