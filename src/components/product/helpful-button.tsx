"use client";

import { useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { markReviewHelpful } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

export function HelpfulButton({ reviewId, count }: { reviewId: string; count: number }) {
  const [voted, setVoted] = useState(false);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      disabled={voted}
      onClick={() => {
        setVoted(true);
        start(() => markReviewHelpful(reviewId).then(() => undefined));
      }}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border-2 px-3 text-xs transition-colors",
        voted ? "border-ink bg-muted text-ink" : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
      )}
      aria-pressed={voted}
    >
      <ThumbsUp className="size-3.5" /> Helpful{count + (voted ? 1 : 0) > 0 && ` · ${count + (voted ? 1 : 0)}`}
    </button>
  );
}
