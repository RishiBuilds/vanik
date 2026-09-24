import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { NotFoundContent } from "@/components/layout/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-16 items-center lg:h-[4.5rem]">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center py-16">
        <NotFoundContent />
      </main>
      <footer className="container-page py-6 text-center text-xs text-ink-subtle">
        © {new Date().getUTCFullYear()} Vanik Marketplace Pvt. Ltd.
      </footer>
    </div>
  );
}
