import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CircleDollarSign, PiggyBank, Truck, Wallet } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getPayoutsOverview } from "@/lib/queries/vendor-store";
import { PLATFORM_FEE_RATE, PAYOUT_FEE } from "@/lib/services/pricing";
import { formatDate, formatDateShort, formatMoney } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/account/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TBody, THead, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { PayoutMethodCard } from "@/components/vendor/store/payout-method-card";

export const metadata: Metadata = { title: "Payouts · Seller" };


const STATUS = {
  paid: { label: "Paid", tone: "success" },
  in_transit: { label: "In transit", tone: "info" },
  scheduled: { label: "Scheduled", tone: "warning" },
} as const;

export default async function VendorPayoutsPage() {
  const { store } = await requireVendor();
  const data = await getPayoutsOverview(store.id);
  const pct = `${Math.round(PLATFORM_FEE_RATE * 100)}%`;

  const exGross = data.next?.gross ?? 10000;
  const exCommission = Math.round(exGross * PLATFORM_FEE_RATE);
  const exNet = exGross - exCommission - PAYOUT_FEE;

  return (
    <div>
      <PageHeader title="Payouts" description={`Earnings are paid every 14 days, two days after each period closes, less the ${pct} commission.`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Next payout"
          value={data.next ? formatMoney(data.next.amount) : "—"}
          icon={<CalendarClock />}
          hint={data.next ? `Arrives ${formatDate(data.next.payoutDate)}` : "Nothing scheduled yet"}
        />
        <StatCard
          label="In transit"
          value={formatMoney(data.inTransit)}
          icon={<Truck />}
          hint={data.inTransitCount ? "On its way to your account" : "Nothing in transit"}
        />
        <StatCard label="Paid · last 90 days" value={formatMoney(data.paid90)} icon={<Wallet />} hint="Net, after fees" />
        <StatCard label="Lifetime paid" value={formatMoney(data.lifetime)} icon={<PiggyBank />} hint={`${data.paidCount} payouts`} />
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0">
          <CardHeader title="Payout history" description="Each payout covers orders delivered during its period." />
          {data.rows.length === 0 ? (
            <EmptyState
              icon={CircleDollarSign}
              compact
              title="No payouts yet"
              description="Your first payout is scheduled 14 days after your first delivered order."
            />
          ) : (
            <TableWrap className="relative">
              <Table className="min-w-[720px]">
                <THead>
                  <tr>
                    <Th>Period</Th>
                    <Th className="text-right">Gross</Th>
                    <Th className="text-right">Fees</Th>
                    <Th className="text-right">Net</Th>
                    <Th>Method</Th>
                    <Th>Status</Th>
                    <Th>Paid</Th>
                  </tr>
                </THead>
                <TBody>
                  {data.rows.map((p) => (
                    <Tr key={p.id}>
                      <Td className="whitespace-nowrap">
                        {formatDateShort(p.periodStart)} – {formatDate(p.periodEnd)}
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">{formatMoney(p.gross)}</Td>
                      <Td className="whitespace-nowrap text-right tabular-nums text-ink-muted">−{formatMoney(p.fees)}</Td>
                      <Td className="whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(p.amount)}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">{p.method}</Td>
                      <Td>
                        <Badge tone={STATUS[p.status].tone} size="sm" dot>
                          {STATUS[p.status].label}
                        </Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {p.paidAt ? formatDate(p.paidAt) : p.status === "scheduled" ? `Est. ${formatDateShort(p.periodEnd.getTime() + 2 * 86400000)}` : "—"}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-2 order-first 2xl:order-none 2xl:grid-cols-1 2xl:self-start">
          <PayoutMethodCard method={store.payoutMethod ?? null} />

          <Card>
            <CardHeader title="How your earnings are calculated" description={data.next ? "Using your next payout" : "Example on a ₹1,000 sale"} />
            <CardBody>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Gross sales</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(exGross)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Commission ({pct})</dt>
                  <dd className="tabular-nums text-ink-muted">−{formatMoney(exCommission)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Payout fee</dt>
                  <dd className="tabular-nums text-ink-muted">−{formatMoney(PAYOUT_FEE)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t-2 border-line pt-2.5">
                  <dt className="font-medium">You receive</dt>
                  <dd className="text-base font-semibold tabular-nums">{formatMoney(exNet)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span className="bg-success" style={{ width: `${(exNet / exGross) * 100}%` }} />
                <span className="bg-warning" style={{ width: `${(exCommission / exGross) * 100}%` }} />
                <span className="bg-danger" style={{ width: `${(PAYOUT_FEE / exGross) * 100}%` }} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
                Commission applies to item price and shipping. There are no listing or monthly fees.{" "}
                <Link href="/help/fees" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  Fees & payouts guide
                </Link>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
