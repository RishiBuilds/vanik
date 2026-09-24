"use client";

import { useState, useTransition } from "react";
import { CreditCard, MoreHorizontal, Plus, ShieldCheck, Star, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { addCard, addWallet, deletePaymentMethod, setDefaultPaymentMethod } from "@/lib/actions/account";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, RadioCard, RadioGroup } from "@/components/ui/controls";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input } from "@/components/ui/field";
import { CardFields, emptyCard, type CardInputState } from "@/components/forms/card-fields";
import { CardBrandMark, brandLabel } from "@/components/forms/card-brand";

type Method = { id: string; type: "card" | "wallet"; brand: string; last4: string | null; expMonth: number | null; expYear: number | null; holderName: string | null; email: string | null; isDefault: boolean };

function expired(m: Method) {
  if (!m.expYear || !m.expMonth) return false;
  const now = new Date();
  return m.expYear < now.getUTCFullYear() || (m.expYear === now.getUTCFullYear() && m.expMonth < now.getUTCMonth() + 1);
}

export function PaymentManager({ methods, holderName }: { methods: Method[]; holderName: string }) {
  const [adding, setAdding] = useState<"card" | "wallet" | null>(null);
  const [deleting, setDeleting] = useState<Method | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setAdding("card")}>
          <CreditCard /> Add card
        </Button>
        <Button variant="outline" onClick={() => setAdding("wallet")}>
          <Wallet /> Link UPI or wallet
        </Button>
      </div>

      {methods.length === 0 ? (
        <EmptyState icon={CreditCard} title="No saved payment methods" description="Save a card or connect a wallet for one-tap checkout." className="rounded-xl border-2 border-line bg-surface" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m) => (
            <article key={m.id} className={cn("relative overflow-hidden rounded-xl border-2 bg-surface p-5", m.isDefault ? "border-line-strong" : "border-line")}>
              <div className="flex items-start justify-between gap-3">
                <CardBrandMark brand={m.brand} className="h-8 w-12 text-[0.65rem]" />
                <div className="flex items-center gap-1">
                  {m.isDefault && <Badge size="sm" tone="solid">Default</Badge>}
                  {expired(m) && <Badge size="sm" tone="danger">Expired</Badge>}
                  <Dropdown>
                    <DropdownTrigger className="-mr-2 inline-flex size-8 items-center justify-center rounded-md text-ink-subtle hover:bg-muted hover:text-ink" aria-label="Payment method actions">
                      <MoreHorizontal className="size-4" />
                    </DropdownTrigger>
                    <DropdownContent>
                      {!m.isDefault && (
                        <DropdownItem
                          onSelect={() =>
                            start(async () => {
                              const r = await setDefaultPaymentMethod(m.id);
                              if (r.ok) toast.success(r.message ?? "Updated");
                            })
                          }
                        >
                          <Star /> Set as default
                        </DropdownItem>
                      )}
                      {!m.isDefault && <DropdownSeparator />}
                      <DropdownItem destructive onSelect={() => setDeleting(m)}>
                        <Trash2 /> Remove
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
              </div>
              {m.type === "card" ? (
                <>
                  <p className="mt-6 font-mono text-base tracking-widest">•••• •••• •••• {m.last4}</p>
                  <div className="mt-3 flex justify-between text-xs text-ink-subtle">
                    <span className="uppercase tracking-wide">{m.holderName}</span>
                    <span>
                      Exp {String(m.expMonth).padStart(2, "0")}/{String(m.expYear).slice(-2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-6 text-base font-medium">{brandLabel(m.brand)}</p>
                  <p className="mt-1 text-xs text-ink-subtle">{m.email}</p>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-ink-subtle">
        <ShieldCheck className="size-4" /> Card numbers are tokenised by our payment partner — Vanik never stores them.
      </p>

      {adding === "card" && <AddCardDialog holderName={holderName} onClose={() => setAdding(null)} />}
      {adding === "wallet" && <AddWalletDialog onClose={() => setAdding(null)} />}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent
            title="Remove payment method?"
            description={deleting.type === "card" ? `${brandLabel(deleting.brand)} ending ${deleting.last4}` : brandLabel(deleting.brand)}
            size="sm"
          >
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const r = await deletePaymentMethod(deleting.id);
                    if (r.ok) toast.success(r.message ?? "Removed");
                    else toast.error(r.error);
                    setDeleting(null);
                  })
                }
              >
                Remove
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function AddCardDialog({ holderName, onClose }: { holderName: string; onClose: () => void }) {
  const [card, setCard] = useState<CardInputState>({ ...emptyCard, holderName });
  const [makeDefault, setMakeDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Add a card" description="Test with 4242 4242 4242 4242, any future date and any CVC.">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await addCard({ ...card, makeDefault });
              if (r.ok) {
                toast.success(r.message ?? "Card saved");
                onClose();
              } else {
                setError(r.error);
                setErrors(r.fieldErrors ?? {});
              }
            });
          }}
        >
          <FormError message={error} />
          <CardFields value={card} onChange={setCard} errors={errors} />
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(v === true)} /> Make this my default
          </label>
          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddWalletDialog({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<"upi" | "vanikpay">("upi");
  const [handle, setHandle] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Link UPI or a wallet" description="You’ll approve each payment in your UPI app at checkout (simulated).">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await addWallet({ provider, handle });
              if (r.ok) {
                toast.success(r.message ?? "Linked");
                onClose();
              } else setErrors(r.fieldErrors ?? {});
            });
          }}
        >
          <RadioGroup
            value={provider}
            onValueChange={(v) => {
              setProvider(v as "upi" | "vanikpay");
              setErrors({});
            }}
            className="sm:grid-cols-2"
            aria-label="Payment app"
          >
            {(["upi", "vanikpay"] as const).map((p) => (
              <RadioCard key={p} value={p}>
                <span className="flex items-center gap-3">
                  <CardBrandMark brand={p} /> <span className="text-sm font-medium">{brandLabel(p)}</span>
                </span>
              </RadioCard>
            ))}
          </RadioGroup>
          {provider === "upi" ? (
            <Field label="UPI ID" error={errors.handle} hint="Find it in Google Pay, PhonePe, Paytm or your bank’s UPI app.">
              {(p) => <Input {...p} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname@okhdfcbank" autoComplete="off" />}
            </Field>
          ) : (
            <Field label="Vanik account email" error={errors.handle}>
              {(p) => <Input {...p} type="email" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="you@example.com" />}
            </Field>
          )}
          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              <Plus /> Link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
