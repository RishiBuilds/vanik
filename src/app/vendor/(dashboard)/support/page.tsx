import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, CreditCard, LifeBuoy, Mail, Percent, Truck } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getSupportTickets } from "@/lib/queries/vendor-store";
import { formatDate, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/account/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NewTicketButton } from "@/components/vendor/store/new-ticket";

export const metadata: Metadata = { title: "Help & support · Seller" };

const LINKS = [
  { href: "/help/selling", icon: BookOpen, title: "Seller handbook", body: "Listing, photos, pricing and running your shop." },
  { href: "/help/fees", icon: Percent, title: "Fees & payouts", body: "The 8% commission, payout schedule and fees." },
  { href: "/help/shipping", icon: Truck, title: "Shipping", body: "Zones, rates, tracking and delivery issues." },
  { href: "/help/payments", icon: CreditCard, title: "Payments", body: "How buyers pay, refunds and chargebacks." },
];

const STATUS = {
  open: { label: "Open", tone: "info" },
  pending: { label: "Pending", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
} as const;

export default async function VendorSupportPage() {
  const { store } = await requireVendor();
  const tickets = await getSupportTickets(store.id);

  return (
    <div>
      <PageHeader title="Help & support" description="Guides for common questions, and a direct line to the seller support team." actions={<NewTicketButton />} />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.map(({ href, icon: Icon, title, body }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-xl border-2 border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-sm"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold">
                {title} <ArrowRight className="size-3.5 text-ink-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-1 text-xs leading-relaxed text-ink-muted">{body}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="min-w-0">
          <CardHeader title="Your tickets" description="Conversations with seller support" action={tickets.length > 0 ? <NewTicketButton variant="outline" /> : undefined} />
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} compact title="No tickets yet" description="If something’s not right, open a ticket and we’ll help." action={<NewTicketButton />} />
          ) : (
            <ul className="divide-y divide-line">
              {tickets.map((t) => (
                <li key={t.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.subject}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-subtle">
                      <span>{t.category}</span>
                      <span aria-hidden>·</span>
                      <span>Opened {formatDate(t.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span>Updated {timeAgo(t.updatedAt)}</span>
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{t.body}</p>
                  </div>
                  <Badge tone={STATUS[t.status].tone} size="sm" dot className="self-start sm:self-center">
                    {STATUS[t.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="Contact us" />
          <CardBody className="space-y-4 text-sm">
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
              <span>
                <a href="mailto:seller-support@vanik.example" className="font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  seller-support@vanik.example
                </a>
                <span className="mt-0.5 block text-xs text-ink-subtle">Include your shop name: {store.name}</span>
              </span>
            </p>
            <p className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
              <span>
                Monday–Friday, 9am–6pm PT
                <span className="mt-0.5 block text-xs text-ink-subtle">We reply within one working day.</span>
              </span>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
