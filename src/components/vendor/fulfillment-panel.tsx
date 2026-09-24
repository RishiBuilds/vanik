"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, PackageCheck, Printer, Truck, XCircle, Home, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { updateFulfillment } from "@/lib/actions/vendor-orders";
import type { FulfillmentStatus } from "@/lib/db/schema";
import { CARRIERS, nextStatuses, STATUS_META } from "@/lib/services/shipping";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const ICONS: Partial<Record<FulfillmentStatus, typeof Truck>> = {
  confirmed: CheckCircle2,
  packed: PackageCheck,
  shipped: Truck,
  out_for_delivery: MapPinned,
  delivered: Home,
};

const CTA: Partial<Record<FulfillmentStatus, string>> = {
  confirmed: "Confirm order",
  packed: "Mark as packed",
  shipped: "Mark as shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
};

const HINT: Partial<Record<FulfillmentStatus, string>> = {
  placed: "Confirm the order to let the customer know you’re on it.",
  confirmed: "Pack the items, then mark the order as packed.",
  packed: "Add the carrier and tracking number when you hand it over.",
  shipped: "Carrier scans update automatically — or update it manually.",
  out_for_delivery: "Mark delivered once the carrier confirms drop-off.",
};

export function FulfillmentPanel({ storeOrderId, status, defaultCarrier }: { storeOrderId: string; status: FulfillmentStatus; defaultCarrier: string }) {
  const [pending, start] = useTransition();
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [carrier, setCarrier] = useState(defaultCarrier);
  const [tracking, setTracking] = useState("");
  const [reason, setReason] = useState("");
  const options = nextStatuses(status);
  const forward = options.find((s) => s !== "cancelled");
  const canCancel = options.includes("cancelled");

  const run = (next: FulfillmentStatus, extra?: { carrier?: string; trackingNumber?: string; note?: string }) =>
    start(async () => {
      const r = await updateFulfillment({ storeOrderId, next: next as Exclude<FulfillmentStatus, "placed">, ...extra });
      if (r.ok) {
        toast.success(r.message ?? "Updated");
        setShipOpen(false);
        setCancelOpen(false);
      } else toast.error(r.error);
    });

  const Icon = forward ? ICONS[forward] ?? CheckCircle2 : CheckCircle2;

  return (
    <div className="space-y-3">
      {forward ? (
        <>
          <p className="text-sm text-ink-muted">{HINT[status]}</p>
          <Button block size="lg" loading={pending} onClick={() => (forward === "shipped" ? setShipOpen(true) : run(forward))}>
            <Icon /> {CTA[forward]}
          </Button>
        </>
      ) : (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm text-ink-muted">
          {status === "delivered" ? "This order is complete. Nice work!" : "This order was cancelled and the customer refunded."}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
          <Printer /> Packing slip
        </Button>
        {canCancel && (
          <Button variant="danger-ghost" size="sm" className="flex-1" onClick={() => setCancelOpen(true)}>
            <XCircle /> Cancel
          </Button>
        )}
      </div>

      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent title="Ship this order" description="The customer gets a shipping notification with tracking." size="sm">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run("shipped", { carrier, trackingNumber: tracking });
            }}
          >
            <Field label="Carrier">
              {(p) => (
                <Select {...p} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  {CARRIERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Tracking number" optional hint="Leave blank to generate a label (simulated).">
              {(p) => <Input {...p} value={tracking} onChange={(e) => setTracking(e.target.value)} className="font-mono" />}
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={pending}>
                <Truck /> Mark shipped
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent title="Cancel this order?" description="Stock is restored and the customer is refunded for your items." size="sm">
          <div className="space-y-4">
            <Field label="Reason for the customer" optional>
              {(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sorry — this glaze batch didn’t pass our quality check." />}
            </Field>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Keep order</Button>
              </DialogClose>
              <Button variant="danger" loading={pending} onClick={() => run("cancelled", { note: reason || undefined })}>
                Cancel &amp; refund
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <p className="sr-only" aria-live="polite">
        Current status: {STATUS_META[status].label}
      </p>
    </div>
  );
}
