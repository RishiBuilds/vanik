import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
      <p className="eyebrow">Error 404</p>
      <p className="mt-4 font-display text-[7rem] font-bold leading-none tracking-display text-ink sm:text-[9rem]" aria-hidden>
        4<span className="italic text-accent">0</span>4
      </p>
      <h1 className="mt-6 font-display font-bold text-3xl tracking-display sm:text-4xl">This page has left the market</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
        The link may be broken, or the item or shop may no longer be listed. Try searching, or head back to browse what&rsquo;s new.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/search">
            Browse the shop <ArrowRight />
          </Link>
        </Button>
      </div>
      <Link
        href="/search"
        className="mt-8 inline-flex items-center gap-2 text-sm text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
      >
        <Search className="size-4" aria-hidden /> Search products and shops
      </Link>
      <p className="mt-10 text-xs text-ink-subtle">
        Need a hand?{" "}
        <Link href="/help" className="font-medium text-ink-muted hover:text-ink">
          Visit the help center
        </Link>
      </p>
    </div>
  );
}
