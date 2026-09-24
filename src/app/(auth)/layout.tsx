import Image from "next/image";
import { Logo } from "@/components/layout/logo";
import { unsplash } from "@/lib/utils";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <Logo />
        <main id="main" className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-ink-subtle">© Vanik Marketplace · A demo storefront</p>
      </div>
      <div className="relative hidden overflow-hidden bg-night lg:block">
        <Image src={unsplash("1452860606245-08befc0ff44b", 1400, 1800)} alt="" fill priority sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
        <figure className="absolute inset-x-12 bottom-12 max-w-lg text-white">
          <blockquote className="font-display text-3xl font-bold leading-snug">
            “Vanik gave our two-person studio a storefront that feels as considered as the work we make.”
          </blockquote>
          <figcaption className="mt-5 text-sm text-white/75">Priya Raman — Mitti Studio, Pondicherry</figcaption>
        </figure>
      </div>
    </div>
  );
}
