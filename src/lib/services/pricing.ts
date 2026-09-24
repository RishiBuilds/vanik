export const GST_RATE = 0.18;

export type Promo = {
  code: string;
  description: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal: number;
};

export function promoDiscount(promo: Promo | null | undefined, subtotal: number) {
  if (!promo || subtotal < promo.minSubtotal) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  if (promo.type === "fixed") return Math.min(subtotal, promo.value);
  return 0;
}

export function computeTotals(input: { subtotal: number; shipping: number; promo?: Promo | null }) {
  const { subtotal, promo } = input;
  const freeShipping = promo?.type === "free_shipping" && subtotal >= promo.minSubtotal;
  const shipping = freeShipping ? 0 : input.shipping;
  const discount = promoDiscount(promo, subtotal);
  const tax = Math.round(((subtotal - discount) * GST_RATE) / (1 + GST_RATE));
  return {
    subtotal,
    shipping,
    shippingDiscount: freeShipping ? input.shipping : 0,
    discount,
    tax,
    total: subtotal - discount + shipping,
  };
}

export const PLATFORM_FEE_RATE = 0.08;
export const PAYOUT_FEE = 1000;
export const COD_LIMIT = 2_500_000;
