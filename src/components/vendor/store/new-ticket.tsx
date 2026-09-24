"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createSupportTicket } from "@/lib/actions/vendor-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";

const CATEGORIES = ["Orders", "Payouts", "Shipping", "Account", "Other"] as const;
type Category = (typeof CATEGORIES)[number];
const empty = { category: "Orders" as Category, subject: "", message: "" };

export function NewTicketButton({ variant = "primary" }: { variant?: "primary" | "outline" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setErrors({});
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <Plus /> New ticket
        </Button>
      </DialogTrigger>
      <DialogContent title="Contact seller support" description="Tell us what’s going on and we’ll get back to you by email.">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await createSupportTicket(v);
              if (r.ok) {
                toast.success("Ticket sent", { description: r.message ?? "We’ll reply within one working day" });
                setV(empty);
                setOpen(false);
                router.refresh();
              } else {
                setError(r.error);
                setErrors(r.fieldErrors ?? {});
              }
            });
          }}
        >
          <FormError message={error} />
          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select {...p} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value as Category })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Subject" error={errors.subject}>
            {(p) => <Input {...p} value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} maxLength={120} placeholder="e.g. Buyer says parcel never arrived" />}
          </Field>
          <Field label="Message" error={errors.message} hint="Include order numbers or product names if relevant.">
            {(p) => <Textarea {...p} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} maxLength={4000} className="min-h-36" />}
          </Field>
          <div className="flex justify-end gap-2 border-t-2 border-line pt-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Send ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
