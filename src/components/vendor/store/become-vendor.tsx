"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Check, ShoppingBag, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
import { becomeVendor } from "@/lib/actions/vendor-store";
import { Button } from "@/components/ui/button";

export function BecomeVendorCard({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="animate-slide-up">
      <p className="eyebrow mb-3 inline-flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-accent" /> Become a seller
      </p>
      <h1 className="font-display font-bold text-4xl tracking-display sm:text-5xl">Open a shop on Vanik, {name.split(" ")[0]}.</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
        Turn your account into a seller account and set up your shop in a few minutes. No listing or monthly fees — just an 8% commission when you make a sale.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-xs">
        <div className="grid gap-px bg-line sm:grid-cols-2">
          <div className="bg-surface p-6">
            <ShoppingBag className="size-5 text-ink-subtle" strokeWidth={1.75} aria-hidden />
            <h2 className="mt-3 text-sm font-semibold">You keep your shopping account</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Same sign-in ({email}). Your orders, saved items, addresses and reviews stay exactly where they are — switch between shopping and selling any time.
            </p>
          </div>
          <div className="bg-surface p-6">
            <Store className="size-5 text-accent" strokeWidth={1.75} aria-hidden />
            <h2 className="mt-3 text-sm font-semibold">You get a seller dashboard</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
              {[
                { Icon: BarChart3, t: "Orders, inventory and analytics" },
                { Icon: Wallet, t: "Payouts every 14 days" },
                { Icon: Check, t: "Your own prices, shipping and policies" },
              ].map(({ Icon, t }) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon className="size-4 text-success" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t-2 border-line bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="link">
            <Link href="/sell">Learn more about selling</Link>
          </Button>
          <Button
            size="lg"
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await becomeVendor();
                if (r.ok) {
                  toast.success(r.message ?? "You’re a seller now");
                  router.refresh();
                } else toast.error(r.error);
              })
            }
          >
            Upgrade to a seller account <ArrowRight />
          </Button>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-subtle">By continuing you agree to the Vanik seller terms. You can pause your shop at any time.</p>
    </div>
  );
}
