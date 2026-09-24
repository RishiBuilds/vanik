"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VendorError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-line bg-surface shadow-sm">
        <TriangleAlert className="size-6 text-danger" strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="mt-5 font-display font-bold text-3xl tracking-display">This page didn’t load</h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">Your shop data is safe. Try again, or head back to the overview.</p>
      {error.digest && <p className="mt-2 font-mono text-2xs text-ink-subtle">Reference {error.digest}</p>}
      <div className="mt-6 flex gap-2">
        <Button onClick={() => retry()}>
          <RefreshCw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/vendor">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
