"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Lock, Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { PayoutMethod } from "@/lib/db/schema";
import { updatePayoutMethod } from "@/lib/actions/vendor-store";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { RadioCard, RadioGroup } from "@/components/ui/controls";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FormError, Input } from "@/components/ui/field";

export function PayoutMethodCard({ method }: { method: PayoutMethod | null }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader
        title="Payout method"
        description="Where your earnings are sent"
        action={
          <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
            <Pencil /> {method ? "Edit" : "Add"}
          </Button>
        }
      />
      <CardBody>
        {method ? (
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-muted">
              {method.type === "bank" ? <Landmark className="size-[1.125rem]" aria-hidden /> : <Wallet className="size-[1.125rem]" aria-hidden />}
            </span>
            <div className="min-w-0">
              {method.type === "bank" ? (
                <>
                  <p className="text-sm font-medium">
                    {method.bankName} <span className="tabular-nums text-ink-muted">•••• {method.accountLast4}</span>
                  </p>
                  <p className="truncate text-xs text-ink-subtle">{method.holderName} · Savings / current account</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">UPI · {method.upiId}</p>
                  <p className="truncate text-xs text-ink-subtle">{method.holderName}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Add a bank account or UPI ID so we can send your earnings.</p>
        )}
        <p className="mt-4 flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Demo only: bank details are mocked. The IFSC and full account number are validated then discarded — only the last 4 digits are kept, as a real payment provider would tokenise them.
        </p>
      </CardBody>
      {open && <PayoutMethodDialog method={method} onClose={() => setOpen(false)} />}
    </Card>
  );
}

function PayoutMethodDialog({ method, onClose }: { method: PayoutMethod | null; onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<"bank" | "upi">(method?.type ?? "bank");
  const [bank, setBank] = useState({
    holderName: method?.holderName ?? "",
    bankName: method?.type === "bank" ? method.bankName : "",
    ifsc: "",
    accountNumber: "",
  });
  const [upiId, setUpiId] = useState(method?.type === "upi" ? method.upiId : "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const digits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Payout method" description="Choose where we send your earnings every 14 days.">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updatePayoutMethod(type === "bank" ? { type, ...bank } : { type, upiId, holderName: bank.holderName });
              if (r.ok) {
                toast.success(r.message ?? "Payout method saved");
                router.refresh();
                onClose();
              } else {
                setError(r.error);
                setErrors(r.fieldErrors ?? {});
              }
            });
          }}
        >
          <FormError message={error} />
          <RadioGroup value={type} onValueChange={(v) => setType(v as "bank" | "upi")} className="grid-cols-2" aria-label="Payout type">
            <RadioCard value="bank">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Landmark className="size-4" aria-hidden /> Bank account
              </span>
              <span className="mt-0.5 block text-xs text-ink-subtle">NEFT / IMPS · same or next day</span>
            </RadioCard>
            <RadioCard value="upi">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4" aria-hidden /> UPI
              </span>
              <span className="mt-0.5 block text-xs text-ink-subtle">Instant, up to ₹1 lakh per payout</span>
            </RadioCard>
          </RadioGroup>

          {type === "bank" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account holder name" error={errors.holderName} className="sm:col-span-2">
                {(p) => <Input {...p} autoComplete="name" value={bank.holderName} onChange={(e) => setBank({ ...bank, holderName: e.target.value })} />}
              </Field>
              <Field label="Bank name" error={errors.bankName} className="sm:col-span-2">
                {(p) => <Input {...p} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />}
              </Field>
              <Field label="IFSC code" error={errors.ifsc} hint="11 characters · not stored">
                {(p) => (
                  <Input {...p} autoComplete="off" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })} placeholder="HDFC0001234" className="font-mono uppercase" />
                )}
              </Field>
              <Field label="Account number" error={errors.accountNumber} hint="Only the last 4 digits are kept">
                {(p) => (
                  <Input {...p} inputMode="numeric" autoComplete="off" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: digits(e.target.value, 18) })} placeholder="50100123456789" />
                )}
              </Field>
            </div>
          ) : (
            <div className="grid gap-4">
              <Field label="Account holder name" error={errors.holderName}>
                {(p) => <Input {...p} autoComplete="name" value={bank.holderName} onChange={(e) => setBank({ ...bank, holderName: e.target.value })} />}
              </Field>
              <Field label="UPI ID" error={errors.upiId} hint="Business UPI IDs work best, e.g. mittistudio@okaxis">
                {(p) => <Input {...p} autoComplete="off" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourshop@okhdfcbank" />}
              </Field>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save payout method
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
