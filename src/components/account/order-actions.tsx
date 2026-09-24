"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelMyStoreOrder } from "@/lib/actions/account";
import { addToCart } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function CancelShipmentButton({ storeOrderId, storeName }: { storeOrderId: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger-ghost" size="sm">
          <XCircle /> Cancel items
        </Button>
      </DialogTrigger>
      <DialogContent title={`Cancel your ${storeName} items?`} description="The shop hasn’t packed them yet, so you’ll get a full refund to your original payment method." size="sm">
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Keep order</Button>
          </DialogClose>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await cancelMyStoreOrder(storeOrderId);
                if (res.ok) {
                  toast.success(res.message ?? "Cancelled");
                  setOpen(false);
                } else toast.error(res.error);
              })
            }
          >
            Cancel and refund
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BuyAgainButton({ variantId }: { variantId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!variantId) return null;
  return (
    <Button
      variant="outline"
      size="xs"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await addToCart({ variantId, quantity: 1 });
          if (res.ok) toast.success(res.message ?? "Added to cart", { action: { label: "View cart", onClick: () => router.push("/cart") } });
          else toast.error(res.error);
        })
      }
    >
      <RotateCcw /> Buy again
    </Button>
  );
}
