"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShopError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-20 lg:py-28">
      <div role="alert" className="flex max-w-lg flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 -m-3 rounded-full bg-danger-soft blur-xl" aria-hidden />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border-2 border-line bg-surface shadow-sm">
            <TriangleAlert className="size-6 text-danger" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 font-display font-bold text-3xl tracking-display sm:text-4xl">We couldn&rsquo;t load this page</h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
          This is usually temporary. Try again in a moment, and if it keeps happening, let us know.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => retry()}>
            <RefreshCw /> Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-8 font-mono text-2xs text-ink-subtle">
            Reference: <span className="select-all">{error.digest}</span>
          </p>
        )}
        <p className="mt-4 text-xs text-ink-subtle">
          Still stuck?{" "}
          <Link href="/help" className="font-medium text-ink-muted hover:text-ink">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
