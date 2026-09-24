"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Lock, MapPin, Package, Plus, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { placeOrder, type CheckoutInput } from "@/lib/actions/checkout";
import { COD_LIMIT, computeTotals, type Promo } from "@/lib/services/pricing";
import type { RateQuote } from "@/lib/services/shipping";
import { NETBANKING_BANKS, WALLETS, type WalletId } from "@/lib/services/wallets";
import { emptyAddress, type AddressInput } from "@/lib/geo";
import { addressSchema, cardSchema, upiSchema } from "@/lib/validation";
import { z } from "zod";
import { cn, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, RadioCard, RadioGroup } from "@/components/ui/controls";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { AddressFields } from "@/components/forms/address-fields";
import { CardFields, emptyCard, type CardInputState } from "@/components/forms/card-fields";
import { CardBrandMark, brandLabel } from "@/components/forms/card-brand";
import { SummaryRows } from "@/components/cart/order-summary";

type Group = {
  store: { id: string; name: string; slug: string };
  subtotal: number;
  rates: RateQuote[];
  lines: { id: string; title: string; image: string | null; variantLabel: string | null; quantity: number; unitPrice: number }[];
};
type SavedAddress = { id: string; label: string; fullName: string; line1: string; line2: string | null; city: string; region: string; postalCode: string; phone: string | null; isDefault: boolean };
type SavedMethod = { id: string; type: "card" | "wallet"; brand: string; last4: string | null; expMonth: number | null; expYear: number | null; email: string | null; isDefault: boolean };

type Step = "address" | "shipping" | "payment" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Shipping address" },
  { key: "shipping", label: "Delivery" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review & place order" },
];

function addDays(days: number) {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) added++;
  }
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export function CheckoutFlow({
  email,
  name,
  groups,
  subtotal,
  promo,
  addresses,
  methods,
}: {
  email: string;
  name: string;
  groups: Group[];
  subtotal: number;
  promo: Promo | null;
  addresses: SavedAddress[];
  methods: SavedMethod[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(addresses.length ? "shipping" : "address");
  const [done, setDone] = useState<Set<Step>>(new Set(addresses.length ? ["address"] : []));

  const [addrChoice, setAddrChoice] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new");
  const [newAddr, setNewAddr] = useState<AddressInput>({ ...emptyAddress, fullName: name });
  const [saveAddr, setSaveAddr] = useState(true);
  const [addrErrors, setAddrErrors] = useState<Record<string, string[] | undefined>>({});

  const [rates, setRates] = useState<Record<string, string>>(() => Object.fromEntries(groups.map((g) => [g.store.id, g.rates[0]!.rateId])));

  const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0];
  const [payChoice, setPayChoice] = useState<string>(defaultMethod ? `saved:${defaultMethod.id}` : "card");
  const [card, setCard] = useState<CardInputState>({ ...emptyCard, holderName: name });
  const [saveCard, setSaveCard] = useState(true);
  const [cardErrors, setCardErrors] = useState<Record<string, string[] | undefined>>({});
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState<string>("");
  const [walletError, setWalletError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const shippingTotal = groups.reduce((s, g) => s + (g.rates.find((r) => r.rateId === rates[g.store.id])?.price ?? 0), 0);
  const totals = useMemo(() => computeTotals({ subtotal, shipping: shippingTotal, promo }), [subtotal, shippingTotal, promo]);
  const itemCount = groups.reduce((n, g) => n + g.lines.reduce((m, l) => m + l.quantity, 0), 0);

  const selectedAddress = addrChoice === "new" ? null : addresses.find((a) => a.id === addrChoice);

  function complete(s: Step, next: Step) {
    setDone((d) => new Set(d).add(s));
    setStep(next);
    setError(null);
    requestAnimationFrame(() => document.getElementById(`step-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function continueAddress() {
    if (addrChoice === "new") {
      const r = addressSchema.safeParse(newAddr);
      if (!r.success) {
        setAddrErrors(z.flattenError(r.error).fieldErrors);
        return;
      }
      setAddrErrors({});
    }
    complete("address", "shipping");
  }

  function continuePayment() {
    if (payChoice === "card") {
      const r = cardSchema.safeParse(card);
      if (!r.success) {
        setCardErrors(z.flattenError(r.error).fieldErrors);
        return;
      }
      setCardErrors({});
    }
    if (payChoice === "wallet:upi" && !upiSchema.safeParse(upiId).success) {
      setWalletError("Enter a valid UPI ID, e.g. name@okhdfcbank");
      return;
    }
    if (payChoice === "wallet:netbanking" && !bank) {
      setWalletError("Choose your bank");
      return;
    }
    setWalletError(null);
    complete("payment", "review");
  }

  function paymentPayload(): CheckoutInput["payment"] {
    if (payChoice.startsWith("saved:")) return { kind: "saved", id: payChoice.slice(6) };
    if (payChoice === "card") return { kind: "card", value: card, save: saveCard };
    if (payChoice === "cod") return { kind: "cod" };
    const provider = payChoice.replace("wallet:", "") as WalletId;
    return { kind: "wallet", provider, handle: provider === "upi" ? upiId.trim() : provider === "netbanking" ? bank : undefined };
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await placeOrder({
        address: addrChoice === "new" ? { kind: "new", value: newAddr, save: saveAddr } : { kind: "saved", id: addrChoice },
        shipping: rates,
        payment: paymentPayload(),
        expectedTotal: totals.total,
      });
      if (res.ok) {
        toast.success("Order placed!");
        router.push(`/checkout/confirmation/${res.orderId}`);
        return;
      }
      setError(res.error);
      if (res.step === "payment") {
        if (res.fieldErrors) setCardErrors(res.fieldErrors);
        setStep("payment");
      } else if (res.step === "address") setStep("address");
      else router.refresh();
    });
  }

  const paymentSummary = (() => {
    if (payChoice.startsWith("saved:")) {
      const m = methods.find((x) => `saved:${x.id}` === payChoice);
      if (!m) return null;
      return { brand: m.brand, label: m.type === "card" ? `${brandLabel(m.brand)} ending ${m.last4}` : `${brandLabel(m.brand)}${m.email ? ` · ${m.email}` : ""}` };
    }
    if (payChoice === "card") return { brand: "card", label: `New card ending ${card.number.replace(/\D/g, "").slice(-4) || "••••"}` };
    if (payChoice === "cod") return { brand: "cod", label: "Cash on delivery" };
    const w = WALLETS.find((x) => `wallet:${x.id}` === payChoice);
    if (!w) return null;
    const handle = w.id === "upi" ? upiId : w.id === "netbanking" ? bank : "";
    return { brand: w.id, label: handle ? `${w.label} · ${handle}` : w.label };
  })();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14">
      <div>
        <h1 className="font-display font-bold text-4xl tracking-display">Checkout</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{email}</span>
        </p>

        <ol className="mt-8 space-y-4">

          <StepCard id="address" index={1} label={STEPS[0]!.label} active={step === "address"} done={done.has("address")} onEdit={() => setStep("address")}
            summary={
              selectedAddress ? (
                <AddressLine a={selectedAddress} />
              ) : (
                <AddressLine a={{ ...newAddr, line2: newAddr.line2 || null, label: newAddr.label }} />
              )
            }
          >
            <RadioGroup value={addrChoice} onValueChange={setAddrChoice} aria-label="Shipping address">
              {addresses.map((a) => (
                <RadioCard key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.label}</span>
                    {a.isDefault && <Badge size="sm">Default</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {a.fullName} · {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.region} {a.postalCode}
                  </p>
                </RadioCard>
              ))}
              <RadioCard value="new">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Plus className="size-4" /> {addresses.length ? "Ship to a new address" : "Add a shipping address"}
                </span>
              </RadioCard>
            </RadioGroup>
            {addrChoice === "new" && (
              <div className="mt-5 rounded-lg border-2 border-line p-4 sm:p-5">
                <AddressFields value={newAddr} onChange={setNewAddr} errors={addrErrors} />
                <label className="mt-4 flex items-center gap-2.5 text-sm">
                  <Checkbox checked={saveAddr} onCheckedChange={(v) => setSaveAddr(v === true)} /> Save this address to my account
                </label>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={continueAddress}>Continue to delivery</Button>
            </div>
          </StepCard>


          <StepCard id="shipping" index={2} label={STEPS[1]!.label} active={step === "shipping"} done={done.has("shipping")} onEdit={() => setStep("shipping")}
            summary={
              <ul className="space-y-1">
                {groups.map((g) => {
                  const r = g.rates.find((x) => x.rateId === rates[g.store.id])!;
                  return (
                    <li key={g.store.id}>
                      <span className="font-medium text-ink">{g.store.name}</span> · {r.name} ({r.price === 0 ? "Free" : formatMoney(r.price)}) · arrives by {addDays(r.maxDays + 1)}
                    </li>
                  );
                })}
              </ul>
            }
          >
            <p className="mb-5 text-sm text-ink-muted">Each shop ships its items separately. Choose a speed for each.</p>
            <div className="space-y-6">
              {groups.map((g) => (
                <fieldset key={g.store.id}>
                  <legend className="mb-3 flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Store className="size-4 text-ink-subtle" /> {g.store.name}
                    </span>
                    <span className="flex -space-x-2">
                      {g.lines.slice(0, 4).map((l) => (
                        <span key={l.id} className="relative size-8 overflow-hidden rounded-md bg-muted ring-2 ring-surface">
                          {l.image && <Image src={l.image} alt="" fill sizes="32px" className="object-cover" />}
                        </span>
                      ))}
                    </span>
                  </legend>
                  <RadioGroup value={rates[g.store.id]} onValueChange={(v) => setRates((r) => ({ ...r, [g.store.id]: v }))} className="sm:grid-cols-2" aria-label={`Delivery for ${g.store.name}`}>
                    {g.rates.map((r) => (
                      <RadioCard key={r.rateId} value={r.rateId}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{r.name}</p>
                            <p className="mt-0.5 text-xs text-ink-subtle">
                              {r.carrier} · arrives {addDays(r.minDays + 1)} – {addDays(r.maxDays + 1)}
                            </p>
                          </div>
                          <span className={cn("text-sm font-medium tabular-nums", r.price === 0 && "text-success")}>{r.price === 0 ? "Free" : formatMoney(r.price)}</span>
                        </div>
                      </RadioCard>
                    ))}
                  </RadioGroup>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => complete("shipping", "payment")}>Continue to payment</Button>
            </div>
          </StepCard>


          <StepCard id="payment" index={3} label={STEPS[2]!.label} active={step === "payment"} done={done.has("payment")} onEdit={() => setStep("payment")}
            summary={paymentSummary && (
              <span className="flex items-center gap-2">
                <CardBrandMark brand={paymentSummary.brand} /> {paymentSummary.label}
              </span>
            )}
          >
            {error && step === "payment" && <FormError message={error} />}
            <RadioGroup value={payChoice} onValueChange={setPayChoice} aria-label="Payment method" className={cn(error && step === "payment" && "mt-4")}>
              {methods.length > 0 && <p className="eyebrow mb-1">Saved</p>}
              {methods.map((m) => (
                <RadioCard key={m.id} value={`saved:${m.id}`}>
                  <div className="flex items-center gap-3">
                    <CardBrandMark brand={m.brand} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {m.type === "card" ? `${brandLabel(m.brand)} •••• ${m.last4}` : brandLabel(m.brand)}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        {m.type === "card" ? `Expires ${String(m.expMonth).padStart(2, "0")}/${String(m.expYear).slice(-2)}` : m.email}
                      </p>
                    </div>
                    {m.isDefault && <Badge size="sm">Default</Badge>}
                  </div>
                </RadioCard>
              ))}
              <p className="eyebrow mb-1 mt-3">{methods.length ? "Other ways to pay" : "Choose how to pay"}</p>
              {WALLETS.filter((w) => w.id === "upi").map((w) => (
                <RadioCard key={w.id} value={`wallet:${w.id}`}>
                  <span className="flex items-center gap-3">
                    <CardBrandMark brand={w.id} />
                    <span>
                      <span className="block text-sm font-medium">{w.label}</span>
                      <span className="block text-xs text-ink-subtle">{w.hint}</span>
                    </span>
                  </span>
                </RadioCard>
              ))}
              {payChoice === "wallet:upi" && (
                <div className="rounded-lg border-2 border-line p-4 sm:p-5">
                  <Field label="UPI ID" error={walletError} hint="You’ll get a collect request in your UPI app to approve (simulated).">
                    {(p) => <Input {...p} value={upiId} onChange={(e) => { setUpiId(e.target.value); setWalletError(null); }} placeholder="yourname@okhdfcbank" autoComplete="off" />}
                  </Field>
                </div>
              )}
              <RadioCard value="card">
                <span className="flex items-center gap-3">
                  <CardBrandMark brand="card" />
                  <span>
                    <span className="block text-sm font-medium">Credit or debit card</span>
                    <span className="block text-xs text-ink-subtle">Visa, Mastercard, RuPay, Amex</span>
                  </span>
                </span>
              </RadioCard>
              {payChoice === "card" && (
                <div className="rounded-lg border-2 border-line p-4 sm:p-5">
                  <CardFields value={card} onChange={setCard} errors={cardErrors} />
                  <label className="mt-4 flex items-center gap-2.5 text-sm">
                    <Checkbox checked={saveCard} onCheckedChange={(v) => setSaveCard(v === true)} /> Save card for faster checkout
                  </label>
                </div>
              )}
              {WALLETS.filter((w) => w.id !== "upi").map((w) => (
                <RadioCard key={w.id} value={`wallet:${w.id}`}>
                  <span className="flex items-center gap-3">
                    <CardBrandMark brand={w.id} />
                    <span>
                      <span className="block text-sm font-medium">{w.label}</span>
                      <span className="block text-xs text-ink-subtle">{w.hint}</span>
                    </span>
                  </span>
                </RadioCard>
              ))}
              {payChoice === "wallet:netbanking" && (
                <div className="rounded-lg border-2 border-line p-4 sm:p-5">
                  <Field label="Your bank" error={walletError}>
                    {(p) => (
                      <Select {...p} value={bank} onChange={(e) => { setBank(e.target.value); setWalletError(null); }}>
                        <option value="">Select your bank…</option>
                        {NETBANKING_BANKS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
              )}
              <RadioCard value="cod" disabled={totals.total > COD_LIMIT}>
                <span className="flex items-center gap-3">
                  <CardBrandMark brand="cod" />
                  <span>
                    <span className="block text-sm font-medium">Cash on delivery</span>
                    <span className="block text-xs text-ink-subtle">
                      {totals.total > COD_LIMIT ? `Available for orders up to ${formatMoney(COD_LIMIT)}` : "Pay by cash or UPI when each package arrives"}
                    </span>
                  </span>
                </span>
              </RadioCard>
            </RadioGroup>
            <div className="mt-6 flex justify-end">
              <Button onClick={continuePayment}>Review order</Button>
            </div>
          </StepCard>


          <StepCard id="review" index={4} label={STEPS[3]!.label} active={step === "review"} done={false}>
            {error && step === "review" && <FormError message={error} />}
            <div className={cn("space-y-4", error && "mt-4")}>
              {groups.map((g) => {
                const r = g.rates.find((x) => x.rateId === rates[g.store.id])!;
                return (
                  <div key={g.store.id} className="rounded-lg border-2 border-line">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-muted/40 px-4 py-2.5 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Package className="size-3.5" /> Shipment from {g.store.name}
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <Truck className="size-3.5" /> {r.name} · arrives by {addDays(r.maxDays + 1)}
                      </span>
                    </div>
                    <ul className="divide-y divide-line">
                      {g.lines.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            {l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{l.title}</span>
                            <span className="block text-xs text-ink-subtle">
                              {l.variantLabel ? `${l.variantLabel} · ` : ""}Qty {l.quantity}
                            </span>
                          </span>
                          <span className="text-sm tabular-nums">{formatMoney(l.unitPrice * l.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-subtle">
              By placing your order you agree to Vanik’s{" "}
              <Link href="/legal/terms" className="underline underline-offset-2">
                terms
              </Link>{" "}
              and each shop’s return policy. This is a demo — no real payment is taken.
            </p>
            <Button size="lg" block className="mt-5" onClick={submit} loading={pending} disabled={step !== "review"}>
              <Lock /> Place order · {formatMoney(totals.total)}
            </Button>
          </StepCard>
        </ol>
      </div>


      <aside className="lg:sticky lg:top-8 lg:self-start">
        <details className="group rounded-xl border-2 border-line bg-surface lg:hidden" >
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium">
            <span className="flex items-center gap-2">
              Order summary <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </span>
            <span className="tabular-nums">{formatMoney(totals.total)}</span>
          </summary>
          <div className="border-t-2 border-line px-5 py-4">
            <SummaryItems groups={groups} />
            <SummaryRows totals={totals} itemCount={itemCount} className="mt-5" />
          </div>
        </details>
        <div className="hidden rounded-xl border-2 border-line bg-surface p-6 lg:block">
          <h2 className="text-base font-semibold">Order summary</h2>
          <SummaryItems groups={groups} className="mt-5" />
          <SummaryRows totals={totals} itemCount={itemCount} className="mt-6 border-t-2 border-line pt-5" />
          {promo && (
            <p className="mt-4 rounded-md bg-success-soft px-3 py-2 text-xs text-success">
              <span className="font-semibold">{promo.code}</span> applied · {promo.description}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function SummaryItems({ groups, className }: { groups: Group[]; className?: string }) {
  return (
    <ul className={cn("max-h-80 space-y-3 overflow-y-auto pr-1", className)}>
      {groups.flatMap((g) =>
        g.lines.map((l) => (
          <li key={l.id} className="flex items-center gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-ink text-2xs font-semibold text-ink-inverse">
                {l.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{l.title}</span>
              <span className="block truncate text-xs text-ink-subtle">{g.store.name}</span>
            </span>
            <span className="text-sm tabular-nums">{formatMoney(l.unitPrice * l.quantity)}</span>
          </li>
        )),
      )}
    </ul>
  );
}

function AddressLine({ a }: { a: { label?: string; fullName: string; line1: string; line2: string | null; city: string; region: string; postalCode: string } }) {
  return (
    <span className="flex items-start gap-2">
      <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
      <span>
        <span className="font-medium text-ink">{a.fullName}</span> · {a.line1}
        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.region} {a.postalCode}
      </span>
    </span>
  );
}

function StepCard({
  id,
  index,
  label,
  active,
  done,
  onEdit,
  summary,
  children,
}: {
  id: Step;
  index: number;
  label: string;
  active: boolean;
  done: boolean;
  onEdit?: () => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li id={`step-${id}`} className={cn("scroll-mt-6 rounded-xl border-2 bg-surface transition-shadow", active ? "border-line-strong shadow-md" : "border-line")}>
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-3 text-base font-semibold">
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
              done && !active ? "bg-success text-white" : active ? "bg-main text-main-foreground" : "bg-muted text-ink-subtle",
            )}
          >
            {done && !active ? <Check className="size-3.5" strokeWidth={3} /> : index}
          </span>
          <span className={cn(!active && !done && "text-ink-subtle")}>{label}</span>
        </h2>
        {done && !active && onEdit && (
          <button type="button" onClick={onEdit} className="text-sm font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            Edit
          </button>
        )}
      </div>
      {done && !active && summary && <div className="-mt-1 px-5 pb-4 pl-[3.75rem] text-sm text-ink-muted sm:px-6 sm:pl-[4.25rem]">{summary}</div>}
      {active && <div className="border-t-2 border-line px-5 py-5 sm:px-6 sm:py-6 animate-fade-in">{children}</div>}
    </li>
  );
}
