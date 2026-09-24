"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className, compact, inverted }: { className?: string; compact?: boolean; inverted?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className={cn("flex items-center gap-2 text-sm", inverted ? "text-white" : "text-success", className)} role="status">
        <Check className="size-4" /> You’re subscribed — thanks!
      </p>
    );
  }

  return (
    <form
      className={cn("w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await subscribeNewsletter(email);
          if (res.ok) {
            setDone(true);
            toast.success(res.message ?? "Subscribed");
          } else setError(res.error);
        });
      }}
      noValidate
    >
      <div className={cn("flex gap-2", compact ? "max-w-sm" : "")}>
        <label htmlFor={compact ? "nl-footer" : "nl-hero"} className="sr-only">
          Email address
        </label>
        <input
          id={compact ? "nl-footer" : "nl-hero"}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          aria-invalid={!!error}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-base border-2 px-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas",
            inverted
              ? "border-border bg-white text-black placeholder:text-black/50 focus:ring-main"
              : "border-border bg-secondary-background text-ink placeholder:text-ink-subtle focus:ring-ring",
          )}
        />
        <Button type="submit" loading={pending} variant="primary">
          Subscribe {!compact && <ArrowRight />}
        </Button>
      </div>
      {error && <p className={cn("mt-2 text-xs", inverted ? "text-white" : "text-danger")}>{error}</p>}
    </form>
  );
}
