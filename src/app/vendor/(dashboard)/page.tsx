import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, MessageSquareText, PackageCheck, Plus, Star } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getVendorOverview, RANGES, type RangeDays } from "@/lib/queries/vendor-analytics";
import { getVendorBadgeCounts } from "@/lib/queries/vendor-shell";
import { cn, firstParam, formatMoney, formatNumber, formatPercent, pluralize, requestNow, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, Rating } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/account/page-header";
import { StatusBadge } from "@/components/orders/status";
import { OrdersChart, RevenueChart, SeriesTable } from "@/components/vendor/charts";
import { Delta, KpiTile } from "@/components/vendor/kpi";

export const metadata: Metadata = { title: "Overview · Seller" };

const SOURCE_LABELS = { search: "Search", direct: "Direct", social: "Social", referral: "Referral" } as const;

export default async function VendorOverviewPage(props: PageProps<"/vendor">) {
  const { user, store } = await requireVendor();
  const r = Number(firstParam((await props.searchParams).range));
  const range: RangeDays = r === 7 || r === 90 ? r : 30;
  const [data, counts] = await Promise.all([getVendorOverview(store.id, range), getVendorBadgeCounts(store.id)]);
  const period = range === 7 ? "7 days" : range === 30 ? "30 days" : "90 days";
  const k = data.kpis;
  const sourceTotal = Object.values(data.sources).reduce((a, b) => a + b, 0);
  const sources = (Object.keys(SOURCE_LABELS) as (keyof typeof SOURCE_LABELS)[])
    .map((key) => ({ key, label: SOURCE_LABELS[key], value: data.sources[key] }))
    .sort((a, b) => b.value - a.value);
  const now = requestNow();

  return (
    <div>
      <PageHeader
        eyebrow={store.name}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here’s how your shop is doing."
        actions={
          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus /> Add product
            </Link>
          </Button>
        }
      />

      {(counts.orders > 0 || counts.lowStock > 0 || counts.reviews > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {[
            { show: counts.orders > 0, href: "/vendor/orders?status=to_fulfil", icon: PackageCheck, title: `${counts.orders} order${counts.orders === 1 ? "" : "s"} to fulfil`, body: "Confirm and pack new orders", tone: "bg-info-soft text-info" },
            { show: counts.lowStock > 0, href: "/vendor/inventory?filter=low", icon: Boxes, title: `${counts.lowStock} SKU${counts.lowStock === 1 ? "" : "s"} running low`, body: "Restock before they sell out", tone: "bg-warning-soft text-warning" },
            { show: counts.reviews > 0, href: "/vendor/reviews?filter=unanswered", icon: MessageSquareText, title: `${counts.reviews} review${counts.reviews === 1 ? "" : "s"} awaiting reply`, body: "Replies build trust with shoppers", tone: "bg-accent-soft text-accent" },
          ]
            .filter((x) => x.show)
            .map(({ href, icon: Icon, title, body, tone }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border-2 border-line bg-surface p-4 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-sm">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-ink-subtle">{body}</span>
                </span>
                <ArrowRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
        </div>
      )}


      <nav aria-label="Date range" className="mb-5 inline-flex rounded-lg border-2 border-line bg-surface p-1">
        {(Object.keys(RANGES) as unknown as RangeDays[]).map((d) => {
          const days = Number(d) as RangeDays;
          return (
            <Link
              key={days}
              href={days === 30 ? "/vendor" : `/vendor?range=${days}`}
              aria-current={range === days ? "true" : undefined}
              className={cn("rounded-md px-3.5 py-1.5 text-sm transition-colors", range === days ? "bg-main text-main-foreground" : "text-ink-muted hover:text-ink")}
            >
              {RANGES[days]}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-ink-muted">Revenue</p>
            <p className="mt-1 text-5xl font-semibold tracking-tight">{formatMoney(k.revenue.value)}</p>
            <div className="mt-2">
              <Delta kpi={k.revenue} period={period} />
            </div>
            <div className="mt-6">
              <RevenueChart data={data.series} />
            </div>
            <SeriesTable data={data.series} columns={[{ key: "revenue", label: "Revenue", format: "money" }, { key: "orders", label: "Orders", format: "number" }]} />
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
          <KpiTile label="Orders" value={formatNumber(k.orders.value)} kpi={k.orders} period={period} />
          <KpiTile label="Average order value" value={formatMoney(k.aov.value)} kpi={k.aov} period={period} />
          <KpiTile label="Conversion rate" value={formatPercent(k.conversion.value, 2)} kpi={k.conversion} period={period} />
          <KpiTile label="Store visits" value={formatNumber(k.visits.value)} kpi={k.visits} period={period} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Orders per day" description={`${formatNumber(k.orders.value)} orders in the ${RANGES[range].toLowerCase()}`} />
          <CardBody>
            <OrdersChart data={data.series} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Traffic sources" description={`${formatNumber(sourceTotal)} visits · ${formatNumber(data.productViews)} product views`} />
          <CardBody>
            <ul className="space-y-4">
              {sources.map((s) => {
                const pct = sourceTotal ? s.value / sourceTotal : 0;
                return (
                  <li key={s.key}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{s.label}</span>
                      <span className="tabular-nums text-ink-muted">
                        {formatNumber(s.value)} <span className="text-ink-subtle">· {formatPercent(pct, 0)}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${pct * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Top products"
            description={`By revenue, ${RANGES[range].toLowerCase()}`}
            action={
              <Link href="/vendor/products" className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                All products
              </Link>
            }
          />
          {data.topProducts.length === 0 ? (
            <EmptyState icon={Star} compact title="No sales in this period" description="Try a longer date range." />
          ) : (
            <ol className="divide-y divide-line">
              {data.topProducts.map((p, i) => (
                <li key={p.productId ?? i} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                  <span className="w-4 text-xs font-medium tabular-nums text-ink-subtle">{i + 1}</span>
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                    {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {p.slug ? (
                      <Link href={`/vendor/products/${p.productId}`} className="block truncate text-sm font-medium hover:underline hover:underline-offset-4">
                        {p.title}
                      </Link>
                    ) : (
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                    )}
                    <span className="block text-xs text-ink-subtle">{formatNumber(p.units)} units sold</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatMoney(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent orders"
            action={
              <Link href="/vendor/orders" className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {data.recent.map((so) => (
              <li key={so.id}>
                <Link href={`/vendor/orders/${so.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50 sm:px-6">
                  <Avatar src={so.order.user.image} name={so.order.user.name} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-medium">{so.order.number}</span>
                      <span className="truncate text-ink-muted">{so.order.user.name}</span>
                    </span>
                    <span className="block text-xs text-ink-subtle">
                      {pluralize(so.items.reduce((n, i) => n + i.quantity, 0), "item")} · {timeAgo(so.createdAt, now)}
                    </span>
                  </span>
                  <StatusBadge status={so.status} size="sm" />
                  <span className="w-20 text-right text-sm font-semibold tabular-nums">{formatMoney(so.subtotal)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Low stock"
            action={
              <Link href="/vendor/inventory?filter=low" className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Manage inventory
              </Link>
            }
          />
          {data.lowStock.length === 0 ? (
            <EmptyState icon={Boxes} compact title="Stock levels look healthy" description="We’ll alert you when a SKU drops below its threshold." />
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3 text-sm sm:px-6">
                  <AlertTriangle className={cn("size-4 shrink-0", v.stock === 0 ? "text-danger" : "text-warning")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <Link href={`/vendor/products/${v.productId}`} className="block truncate font-medium hover:underline hover:underline-offset-4">
                      {v.title}
                    </Link>
                    <span className="block font-mono text-xs text-ink-subtle">
                      {v.sku}
                      {Object.values(v.attributes).length ? ` · ${Object.values(v.attributes).join(" / ")}` : ""}
                    </span>
                  </span>
                  <span className={cn("text-sm font-semibold tabular-nums", v.stock === 0 ? "text-danger" : "text-warning")}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Reviews"
            action={
              <Link href="/vendor/reviews" className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Manage reviews
              </Link>
            }
          />
          <CardBody className="flex flex-wrap items-center gap-x-10 gap-y-6">
            <div>
              <p className="text-4xl font-semibold tabular-nums">{data.reviews.avg.toFixed(2)}</p>
              <Rating value={data.reviews.avg} className="mt-1" />
              <p className="mt-1 text-xs text-ink-subtle">{formatNumber(data.reviews.count)} reviews all time</p>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-ink-subtle">New this period</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{formatNumber(data.reviews.recent)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Awaiting reply</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{formatNumber(data.reviews.unanswered)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-ink-subtle">Response rate</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {data.reviews.count ? formatPercent(1 - data.reviews.unanswered / data.reviews.count, 0) : "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
