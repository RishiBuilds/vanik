import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LOCALE = "en-IN";
export const TIME_ZONE = "Asia/Kolkata";

const currencyWhole = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const currencyPaise = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const currencyCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(paise: number, opts?: { compact?: boolean }) {
  if (opts?.compact) return currencyCompact.format(paise / 100);
  return (paise % 100 === 0 ? currencyWhole : currencyPaise).format(paise / 100);
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
const dateShortFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: TIME_ZONE });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export function formatDate(d: Date | number | string) {
  return dateFmt.format(new Date(d));
}
export function formatDateShort(d: Date | number | string) {
  return dateShortFmt.format(new Date(d));
}
export function formatDateTime(d: Date | number | string) {
  return `${dateTimeFmt.format(new Date(d))} IST`;
}

export function timeAgo(d: Date | number | string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(d).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(LOCALE, opts).format(n);
}

export function formatPercent(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function unsplash(id: string, w = 800, h?: number) {
  const size = h ? `&h=${h}&fit=crop` : "";
  return `https://images.unsplash.com/photo-${id}?w=${w}${size}&q=75&auto=format`;
}

export function truncate(str: string, maxLen: number) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1).trimEnd() + "…";
}

export function formatWeight(grams: number) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`;
  return `${grams} g`;
}

export type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function requestNow() {
  return Date.now();
}
