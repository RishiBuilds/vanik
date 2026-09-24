"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import "./globals.css";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    try {
      const t = localStorage.getItem("vanik-theme");
      const dark = t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    } catch {}
  }, [error]);

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className="min-h-dvh">
        <title>Something went wrong · Vanik</title>
        <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-16">
          <div role="alert" className="flex max-w-lg flex-col items-center text-center">


            <Link href="/" aria-label="Vanik home" className="inline-flex items-center gap-2.5 rounded-md">
              <LogoMark />
              <span className="font-display text-[1.45rem] font-bold leading-none tracking-display text-ink">vanik</span>
            </Link>
            <p className="eyebrow mt-12">Unexpected error</p>
            <h1 className="mt-3 font-display font-bold text-4xl tracking-display">Something went wrong</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
              Vanik hit a problem loading. Please try again. If it keeps happening, email support@vanik.example.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 text-base font-medium text-ink-inverse shadow-xs transition-colors hover:bg-ink/88"
              >
                <RefreshCw className="size-5" aria-hidden /> Try again
              </button>

              <Link
                href="/"
                className="inline-flex h-12 items-center rounded-lg border-2 border-line-strong bg-surface px-6 text-base font-medium text-ink transition-colors hover:border-ink/40"
              >
                Back to home
              </Link>
            </div>
            {error.digest && <p className="mt-8 font-mono text-2xs text-ink-subtle">Reference: {error.digest}</p>}
          </div>
        </main>
      </body>
    </html>
  );
}
