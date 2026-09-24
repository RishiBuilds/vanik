import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Info } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getShippingRates } from "@/lib/queries/vendor-store";
import { PageHeader } from "@/components/account/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ShippingManager } from "@/components/vendor/store/shipping-manager";

export const metadata: Metadata = { title: "Shipping · Seller" };

export default async function VendorShippingPage() {
  const { store } = await requireVendor();
  const rates = await getShippingRates(store.id);

  return (
    <div>
      <PageHeader title="Shipping" description="Set the rates buyers see at checkout, by zone. Changes apply to new orders straight away." />

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
              <Clock className="size-[1.125rem]" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium text-ink-muted">Processing time</p>
              <p className="mt-0.5 text-sm font-semibold">{store.policies.processingTime || "Not set"}</p>
              <p className="mt-0.5 text-xs text-ink-subtle">Shown on your product pages and storefront, before transit time.</p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/vendor/settings?tab=policies">
              Edit policies <ArrowRight />
            </Link>
          </Button>
        </CardBody>
      </Card>

      <ShippingManager
        rates={rates.map((r) => ({
          id: r.id,
          zone: r.zone,
          regions: r.regions,
          name: r.name,
          carrier: r.carrier,
          price: r.price,
          freeOver: r.freeOver,
          minDays: r.minDays,
          maxDays: r.maxDays,
          active: r.active,
        }))}
      />

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          You must keep at least one active Domestic rate. At checkout, buyers choose from your active rates, cheapest first; free-shipping thresholds apply to your shop’s subtotal.{" "}
          <Link href="/help/shipping" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            Shipping guide
          </Link>
        </span>
      </p>
    </div>
  );
}
