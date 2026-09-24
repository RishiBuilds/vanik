"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ReviewFormDialog } from "@/components/product/review-form";

export function MyReviewActions({ review }: { review: { id: string; productId: string; productTitle: string; rating: number; title: string; body: string } }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <ReviewFormDialog
        productId={review.productId}
        productTitle={review.productTitle}
        initial={{ rating: review.rating, title: review.title, body: review.body }}
        trigger={
          <Button variant="ghost" size="xs">
            <Pencil /> Edit
          </Button>
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="danger-ghost" size="xs">
            <Trash2 /> Delete
          </Button>
        </DialogTrigger>
        <DialogContent title="Delete this review?" description="It will be removed from the product page. This can’t be undone." size="sm">
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteReview(review.id);
                  if (res.ok) {
                    toast.success(res.message ?? "Deleted");
                    setOpen(false);
                  } else toast.error(res.error);
                })
              }
            >
              Delete review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
