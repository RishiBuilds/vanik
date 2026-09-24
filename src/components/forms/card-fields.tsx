"use client";

import { CreditCard, Lock } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { CardBrandMark } from "@/components/forms/card-brand";

export type CardInputState = { number: string; expiry: string; cvc: string; holderName: string };
export const emptyCard: CardInputState = { number: "", expiry: "", cvc: "", holderName: "" };

function brandOf(num: string) {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(60|65|81|82|508|353|356)/.test(n)) return "rupay";
  return null;
}

function formatNumber(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 19);
  return /^3[47]/.test(d) ? d.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" ")) : d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

export function CardFields({
  value,
  onChange,
  errors = {},
}: {
  value: CardInputState;
  onChange: (v: CardInputState) => void;
  errors?: Record<string, string[] | undefined>;
}) {
  const brand = brandOf(value.number);
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field label="Card number" className="sm:col-span-6" error={errors.number} hint="Test: 4242 4242 4242 4242 (Visa) or 6521 1111 1111 1110 (RuPay) · decline with 4000 0000 0000 0002">
        {(p) => (
          <div className="relative">
            <Input
              {...p}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={value.number}
              onChange={(e) => onChange({ ...value, number: formatNumber(e.target.value) })}
              className="pr-14 font-mono tracking-wide"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {brand ? <CardBrandMark brand={brand} /> : <CreditCard className="size-5 text-ink-subtle" />}
            </span>
          </div>
        )}
      </Field>
      <Field label="Expiry" className="sm:col-span-3" error={errors.expiry}>
        {(p) => (
          <Input
            {...p}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM / YY"
            value={value.expiry}
            onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value) })}
            className="font-mono"
          />
        )}
      </Field>
      <Field label="Security code" className="sm:col-span-3" error={errors.cvc}>
        {(p) => (
          <div className="relative">
            <Input
              {...p}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand === "amex" ? "4 digits" : "3 digits"}
              value={value.cvc}
              maxLength={4}
              onChange={(e) => onChange({ ...value, cvc: e.target.value.replace(/\D/g, "") })}
              className="pr-10 font-mono"
            />
            <Lock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
        )}
      </Field>
      <Field label="Name on card" className="sm:col-span-6" error={errors.holderName}>
        {(p) => <Input {...p} autoComplete="cc-name" value={value.holderName} onChange={(e) => onChange({ ...value, holderName: e.target.value })} />}
      </Field>
    </div>
  );
}
