"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") onChange(Math.min(5, value + 1));
              if (e.key === "ArrowLeft") onChange(Math.max(1, value - 1));
            }}
            className="p-0.5 transition-transform active:scale-90"
          >
            <Star className={cn("size-7 transition-colors", n <= shown ? "text-main" : "text-sunken")} fill="currentColor" stroke="var(--line)" strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <span className="text-sm text-ink-muted">{LABELS[shown]}</span>
    </div>
  );
}

export function ReviewFormDialog({
  productId,
  productTitle,
  initial,
  trigger,
}: {
  productId: string;
  productTitle: string;
  initial?: { rating: number; title: string; body: string };
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={initial ? "Edit your review" : "Write a review"} description={productTitle}>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rating) {
              setFormError("Choose a star rating.");
              return;
            }
            start(async () => {
              const res = await submitReview({ productId, rating, title, body });
              if (res.ok) {
                toast.success(res.message ?? "Review saved");
                setOpen(false);
                router.refresh();
              } else {
                setFormError(res.error);
                setErrors("fieldErrors" in res ? res.fieldErrors : {});
              }
            });
          }}
        >
          <FormError message={formError} />
          <div>
            <p className="mb-2 text-sm font-medium">Overall rating</p>
            <StarInput
              value={rating}
              onChange={(n) => {
                setRating(n);
                setFormError(null);
              }}
            />
          </div>
          <Field label="Title" error={errors.title}>
            {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words" maxLength={80} />}
          </Field>
          <Field label="Your review" error={errors.body} hint={`${body.trim().length}/2000 · What did you like? How did it fit or feel?`}>
            {(p) => <Textarea {...p} value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={2000} />}
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {initial ? "Save changes" : "Post review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
