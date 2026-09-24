import "server-only";

export type CardInput = {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  holderName: string;
};

export type TokenizedCard = {
  token: string;
  brand: "visa" | "mastercard" | "amex" | "rupay";
  last4: string;
  expMonth: number;
  expYear: number;
};

export type ChargeRequest = {
  amount: number;
  currency: "inr";
  method: { kind: "card_token"; token: string } | { kind: "wallet"; provider: string } | { kind: "cod" };
  description: string;
  idempotencyKey: string;
};

export type ChargeResult =
  | { ok: true; chargeId: string; status: "succeeded" | "pending" }
  | { ok: false; code: "card_declined" | "insufficient_funds" | "invalid_card"; message: string };

export interface PaymentGateway {
  tokenizeCard(card: CardInput): Promise<{ ok: true; card: TokenizedCard } | { ok: false; message: string }>;
  charge(req: ChargeRequest): Promise<ChargeResult>;
  refund(chargeId: string): Promise<{ ok: boolean }>;
}

export function detectBrand(num: string): TokenizedCard["brand"] | null {
  if (/^4/.test(num)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "mastercard";
  if (/^3[47]/.test(num)) return "amex";
  if (/^(60|65|81|82|508|353|356)/.test(num)) return "rupay";
  return null;
}

export function luhnValid(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return num.length >= 13 && sum % 10 === 0;
}

const DECLINE_CARDS: Record<string, Exclude<ChargeResult, { ok: true }>> = {
  "0002": { ok: false, code: "card_declined", message: "Your card was declined. Try a different card." },
  "9995": { ok: false, code: "insufficient_funds", message: "Your card has insufficient funds." },
};

class MockGateway implements PaymentGateway {
  async tokenizeCard(card: CardInput) {
    const number = card.number.replace(/\D/g, "");
    const brand = detectBrand(number);
    if (!brand || !luhnValid(number)) return { ok: false as const, message: "That card number isn’t valid." };
    const now = new Date();
    const expired =
      card.expYear < now.getUTCFullYear() ||
      (card.expYear === now.getUTCFullYear() && card.expMonth < now.getUTCMonth() + 1);
    if (expired) return { ok: false as const, message: "That card has expired." };
    if (!/^\d{3,4}$/.test(card.cvc)) return { ok: false as const, message: "Enter a valid security code." };
    const last4 = number.slice(-4);
    return {
      ok: true as const,
      card: {
        token: `tok_mock_${last4}_${crypto.randomUUID().slice(0, 8)}`,
        brand,
        last4,
        expMonth: card.expMonth,
        expYear: card.expYear,
      },
    };
  }

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    await new Promise((r) => setTimeout(r, 450));
    if (req.method.kind === "card_token") {
      const last4 = req.method.token.split("_")[2] ?? "";
      const decline = DECLINE_CARDS[last4];
      if (decline) return decline;
    }
    return {
      ok: true,
      chargeId: `ch_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      status: req.method.kind === "cod" ? "pending" : "succeeded",
    };
  }

  async refund(chargeId: string) {
    console.info(`[payments:mock] refunded ${chargeId}`);
    return { ok: true };
  }
}

export const paymentGateway: PaymentGateway = new MockGateway();

export { WALLETS } from "./wallets";
