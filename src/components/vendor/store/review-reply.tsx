"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareReply, Pencil, Store } from "lucide-react";
import { toast } from "sonner";
import { respondToReview } from "@/lib/actions/vendor-store";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

function suggestions(rating: number, firstName: string) {
  if (rating >= 4)
    return [
      `Thank you so much, ${firstName}! We’re thrilled it arrived safely and that you love it.`,
      `This made our day — thanks for taking the time to leave a review, ${firstName}.`,
      `So glad it’s found a good home. We hope to make something for you again soon!`,
    ];
  if (rating === 3)
    return [
      `Thanks for the honest feedback, ${firstName}. We’d love to hear what would have made it a 5 — just reply to your order email.`,
      `We appreciate you sharing this. We’re always refining our pieces and your notes help.`,
    ];
  return [
    `I’m really sorry this wasn’t what you hoped for, ${firstName}. Please reach out and we’ll make it right with a replacement or refund.`,
    `Thank you for letting us know. We’ve passed this to our studio team and will be in touch about a fix.`,
  ];
}

export function ReviewReply({
  reviewId,
  rating,
  reviewerName,
  storeName,
  response,
  respondedAt,
}: {
  reviewId: string;
  rating: number;
  reviewerName: string;
  storeName: string;
  response: string | null;
  respondedAt: Date | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(response ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const firstName = reviewerName.split(" ")[0] ?? "there";
  const id = `reply-${reviewId}`;

  const submit = () =>
    start(async () => {
      const r = await respondToReview({ reviewId, response: text });
      if (r.ok) {
        toast.success(r.message ?? "Reply saved");
        setOpen(false);
        setError(null);
        router.refresh();
      } else {
        setError(r.fieldErrors?.response?.[0] ?? r.error);
      }
    });

  if (!open) {
    return response ? (
      <div className="mt-4 rounded-lg border-l-2 border-accent bg-muted/60 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <Store className="size-3.5 text-accent" aria-hidden /> Response from {storeName}
            {respondedAt && <span className="font-normal text-ink-subtle">· {formatDate(respondedAt)}</span>}
          </p>
          <Button
            size="xs"
            variant="ghost"
            className="-mr-2 -mt-1"
            onClick={() => {
              setText(response);
              setOpen(true);
            }}
          >
            <Pencil /> Edit reply
          </Button>
        </div>
        <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{response}</p>
      </div>
    ) : (
      <div className="mt-4">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <MessageSquareReply /> Reply
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-4 rounded-lg border-2 border-line bg-canvas p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        {response ? "Edit your public reply" : "Write a public reply"}
      </label>
      <p className="mt-0.5 text-xs text-ink-subtle">Shown under the review on the product page. {firstName} will be notified.</p>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Suggested replies">
        {suggestions(rating, firstName).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setText(s)}
            className="max-w-full truncate rounded-full border-2 border-line-strong bg-surface px-3 py-1 text-xs text-ink-muted transition-colors hover:border-ink/40 hover:text-ink"
            title={s}
          >
            {s.length > 48 ? `${s.slice(0, 46)}…` : s}
          </button>
        ))}
      </div>
      <Textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-3 min-h-24 bg-surface"
        maxLength={1000}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        autoFocus
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p id={`${id}-err`} className={cn("text-xs", error ? "text-danger" : "text-ink-subtle")} role={error ? "alert" : undefined}>
          {error ?? `${text.length}/1000`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setError(null);
              setText(response ?? "");
            }}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={pending} disabled={text.trim().length < 2}>
            {response ? "Save reply" : "Post reply"}
          </Button>
        </div>
      </div>
    </form>
  );
}
