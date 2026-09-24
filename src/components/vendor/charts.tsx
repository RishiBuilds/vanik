"use client";

import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatMoney, formatNumber } from "@/lib/utils";

type Point = { date: string; revenue: number; orders: number; visits: number };

const tickStyle = { fill: "var(--ink-subtle)", fontSize: 11 };
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function ChartTooltip({ active, payload, label, format, name }: TooltipContentProps<number, string> & { format: (n: number) => string; name: string }) {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0]!.value ?? 0);
  return (
    <div className="rounded-lg border-2 border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="text-ink-subtle">{longDate(String(label))}</p>
      <p className="mt-0.5 flex items-center gap-2 font-medium text-ink">
        <span className="size-2 rounded-full" style={{ background: payload[0]!.color }} aria-hidden />
        {name}: <span className="tabular-nums">{format(v)}</span>
      </p>
    </div>
  );
}


export function RevenueChart({ data }: { data: Point[] }) {
  const gid = useId().replace(/:/g, "");
  const every = Math.max(1, Math.ceil(data.length / 7));
  return (
    <div className="h-72 w-full" role="img" aria-label={`Daily revenue for the last ${data.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={every - 1} minTickGap={16} />
          <YAxis
            tickFormatter={(v: number) => formatMoney(v, { compact: true })}
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={56}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
            content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} format={(n) => formatMoney(n)} name="Revenue" />}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill={`url(#${gid})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


export function OrdersChart({ data }: { data: Point[] }) {
  const every = Math.max(1, Math.ceil(data.length / 7));
  return (
    <div className="h-56 w-full" role="img" aria-label={`Orders per day for the last ${data.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={every - 1} minTickGap={16} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} format={(n) => formatNumber(n)} name="Orders" />}
          />
          <Bar dataKey="orders" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


const FORMATS = { money: (n: number) => formatMoney(n), number: (n: number) => formatNumber(n) };

export function SeriesTable({ data, columns }: { data: Point[]; columns: { key: keyof Point; label: string; format: keyof typeof FORMATS }[] }) {
  return (
    <details className="group mt-3">
      <summary className="cursor-pointer list-none text-xs font-medium text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
        <span className="group-open:hidden">View as table</span>
        <span className="hidden group-open:inline">Hide table</span>
      </summary>
      <div className="mt-3 max-h-64 overflow-auto rounded-md border-2 border-line">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-ink-muted">Date</th>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 text-right font-medium text-ink-muted">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...data].reverse().map((d) => (
              <tr key={d.date}>
                <td className="px-3 py-1.5">{longDate(d.date)}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-1.5 text-right tabular-nums">
                    {FORMATS[c.format](Number(d[c.key]))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
