import Link from "next/link";
import { X } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between border-b-2 border-line px-4 sm:px-8">
        <Logo suffix="Seller" />
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-ink-muted transition-colors hover:bg-muted hover:text-ink"
        >
          <X className="size-4" aria-hidden /> Exit
        </Link>
      </header>
      <main id="main" className="flex w-full flex-1 justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
