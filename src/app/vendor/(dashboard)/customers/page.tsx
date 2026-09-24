import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, MapPin, Repeat, Search, Users, Wallet } from "lucide-react";
import { requireVendor } from "@/lib/session";
import { getTopLocations, getVendorCustomers, type CustomerSort } from "@/lib/queries/vendor-store";
import { cn, firstParam, formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/account/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { TBody, THead, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";

export const metadata: Metadata = { title: "Customers · Seller" };

const SORTS: Record<CustomerSort, string> = { spent: "Top spenders", orders: "Most orders", recent: "Most recent" };

export default async function VendorCustomersPage(props: PageProps<"/vendor/customers">) {
  const { store } = await requireVendor();
  const sp = await props.searchParams;
  const q = firstParam(sp.q)?.trim() ?? "";
  const s = firstParam(sp.sort);
  const sort: CustomerSort = s && s in SORTS ? (s as CustomerSort) : "spent";
  const page = Number(firstParam(sp.page)) || 1;

  const [data, locations] = await Promise.all([getVendorCustomers(store.id, { q, sort, page }), getTopLocations(store.id)]);
  const { kpis } = data;
  const maxLoc = Math.max(1, ...locations.map((l) => l.orders));

  const sortHref = (k: CustomerSort) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (k !== "spent") p.set("sort", k);
    const qs = p.toString();
    return `/vendor/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Customers" description="Who’s buying from your shop, how often, and where they are." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total customers" value={formatNumber(kpis.total)} icon={<Users />} hint="With at least one order" />
        <StatCard label="Repeat customer rate" value={formatPercent(kpis.repeatRate)} icon={<Repeat />} hint="Bought 2 or more times" />
        <StatCard label="Avg. lifetime value" value={formatMoney(kpis.avgLifetimeValue)} icon={<Wallet />} hint="Item subtotal per customer" />
        <StatCard label="New in last 30 days" value={formatNumber(kpis.newLast30)} icon={<CalendarPlus />} hint="First order this month" />
      </div>

      {kpis.total === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="When shoppers buy from your shop, you’ll see who they are, what they spend and where they live."
          action={
            <Button asChild>
              <Link href="/vendor/products">Manage products</Link>
            </Button>
          }
          className="mt-6 rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="min-w-0">
            <div className="flex flex-col gap-3 border-b-2 border-line px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
              <form action="/vendor/customers" role="search" className="relative w-full md:max-w-xs">
                {sort !== "spent" && <input type="hidden" name="sort" value={sort} />}
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
                <Input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search customers" className="h-10 pl-9" />
              </form>
              <nav aria-label="Sort customers" className="scrollbar-none flex gap-1 overflow-x-auto">
                {(Object.keys(SORTS) as CustomerSort[]).map((k) => (
                  <Link
                    key={k}
                    href={sortHref(k)}
                    aria-current={sort === k ? "true" : undefined}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors",
                      sort === k ? "bg-main text-main-foreground" : "text-ink-muted hover:bg-muted hover:text-ink",
                    )}
                  >
                    {SORTS[k]}
                  </Link>
                ))}
              </nav>
            </div>

            {data.items.length === 0 ? (
              <EmptyState
                icon={Search}
                compact
                title="No customers match"
                description={`Nobody matches “${q}”. Try a different name or email.`}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/vendor/customers">Clear search</Link>
                  </Button>
                }
              />
            ) : (
              <TableWrap className="relative">
                <Table className="min-w-[760px]">
                  <THead>
                    <tr>
                      <Th>Customer</Th>
                      <Th className="text-right">Orders</Th>
                      <Th className="text-right">Total spent</Th>
                      <Th className="text-right">Avg. order</Th>
                      <Th>First order</Th>
                      <Th>Last order</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {data.items.map((c) => (
                      <Tr key={c.userId}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar src={c.image} name={c.name} size={36} />
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 font-medium">
                                <span className="truncate">{c.name}</span>
                                {c.orders >= 2 && (
                                  <Badge tone="accent" size="sm">
                                    Repeat
                                  </Badge>
                                )}
                              </p>
                              <p className="truncate text-xs text-ink-subtle">{c.email}</p>
                            </div>
                          </div>
                        </Td>
                        <Td className="text-right tabular-nums">{c.orders}</Td>
                        <Td className="text-right font-semibold tabular-nums">{formatMoney(c.spent)}</Td>
                        <Td className="text-right tabular-nums text-ink-muted">{formatMoney(Math.round(c.spent / c.orders))}</Td>
                        <Td className="whitespace-nowrap text-ink-muted">{formatDate(c.firstOrder)}</Td>
                        <Td className="whitespace-nowrap text-ink-muted">{formatDate(c.lastOrder)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>
            )}
            {data.pageCount > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-line px-5 py-3.5 sm:flex-row sm:px-6">
                <p className="text-xs text-ink-subtle">
                  Page {data.page} of {data.pageCount} · {formatNumber(data.total)} customers
                </p>
                <Pagination page={data.page} pageCount={data.pageCount} basePath="/vendor/customers" params={sp} />
              </div>
            )}
          </Card>

          <Card className="self-start">
            <CardHeader title="Top locations" description="Where your orders ship to" />
            <CardBody>
              {locations.length === 0 ? (
                <p className="text-sm text-ink-muted">No shipping data yet.</p>
              ) : (
                <ol className="grid gap-x-10 gap-y-4 md:grid-cols-2 2xl:grid-cols-1">
                  {locations.map((l, i) => (
                    <li key={`${l.city}-${l.region}`}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="w-4 text-xs tabular-nums text-ink-subtle">{i + 1}</span>
                          <MapPin className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                          <span className="truncate font-medium">
                            {l.city}
                            {l.region && <span className="font-normal text-ink-muted">, {l.region}</span>}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                          {l.orders} {l.orders === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <div className="mt-1.5 ml-6 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(l.orders / maxLoc) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
