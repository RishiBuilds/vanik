import type { FulfillmentStatus } from "@/lib/db/schema";

export type RateQuote = {
  rateId: string;
  name: string;
  carrier: string;
  price: number;
  minDays: number;
  maxDays: number;
};

type RateRow = {
  id: string;
  name: string;
  carrier: string;
  price: number;
  freeOver: number | null;
  minDays: number;
  maxDays: number;
  active: boolean;
};

export function quoteRates(rates: RateRow[], storeSubtotal: number): RateQuote[] {
  return rates
    .filter((r) => r.active)
    .map((r) => ({
      rateId: r.id,
      name: r.name,
      carrier: r.carrier,
      price: r.freeOver != null && storeSubtotal >= r.freeOver ? 0 : r.price,
      minDays: r.minDays,
      maxDays: r.maxDays,
    }))
    .sort((a, b) => a.price - b.price);
}

export const FALLBACK_RATE: RateQuote = {
  rateId: "standard",
  name: "Standard",
  carrier: "Delhivery",
  price: 7900,
  minDays: 4,
  maxDays: 7,
};

export const CARRIERS = ["Delhivery", "Blue Dart", "India Post", "Ekart", "DTDC", "Xpressbees", "Local courier"] as const;

export function generateTrackingNumber(carrier: string) {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
  switch (carrier) {
    case "India Post":
      return `EE${digits(9)}IN`;
    case "Blue Dart":
      return digits(11);
    case "Ekart":
      return `FMPC${digits(10)}`;
    case "DTDC":
      return `D${digits(9)}`;
    default:
      return digits(14);
  }
}

export function estimateDelivery(from: Date, maxDays: number) {
  const d = new Date(from);
  let added = 0;
  while (added < maxDays) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) added++;
  }
  return d;
}

export const FULFILLMENT_FLOW: FulfillmentStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const STATUS_META: Record<FulfillmentStatus, { label: string; description: string; tone: StatusTone }> = {
  placed: { label: "Order placed", description: "We’ve received your order.", tone: "neutral" },
  confirmed: { label: "Confirmed", description: "The seller confirmed your order.", tone: "info" },
  packed: { label: "Packed", description: "Your items are packed and ready to ship.", tone: "info" },
  shipped: { label: "Shipped", description: "Your package is on its way.", tone: "accent" },
  out_for_delivery: { label: "Out for delivery", description: "Arriving today.", tone: "accent" },
  delivered: { label: "Delivered", description: "Your package was delivered.", tone: "success" },
  cancelled: { label: "Cancelled", description: "This order was cancelled.", tone: "danger" },
};

export type StatusTone = "neutral" | "info" | "accent" | "success" | "warning" | "danger";

export function nextStatuses(current: FulfillmentStatus): FulfillmentStatus[] {
  if (current === "delivered" || current === "cancelled") return [];
  const i = FULFILLMENT_FLOW.indexOf(current);
  const next = FULFILLMENT_FLOW[i + 1];
  const canCancel = i < FULFILLMENT_FLOW.indexOf("shipped");
  return [...(next ? [next] : []), ...(canCancel ? (["cancelled"] as const) : [])];
}

export function aggregateStatus(statuses: FulfillmentStatus[]): FulfillmentStatus {
  const active = statuses.filter((s) => s !== "cancelled");
  if (active.length === 0) return "cancelled";
  return active.reduce((min, s) => (FULFILLMENT_FLOW.indexOf(s) < FULFILLMENT_FLOW.indexOf(min) ? s : min));
}

export const CARRIER_HUBS = ["Bhiwandi, Maharashtra", "Gurugram, Haryana", "Hoskote, Karnataka", "Kolkata, West Bengal", "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Ahmedabad, Gujarat"];
