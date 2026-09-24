"use client";

import { useState, useTransition } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "sonner";
import { applyPromoCode, removePromoCode } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";

export function PromoForm({ applied }: { applied: { code: string; description: string } | null }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-success-soft px-3.5 py-2.5 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-success">
          <Tag className="size-4 shrink-0" />
          <span className="truncate">
            <span className="font-semibold">{applied.code}</span> · {applied.description}
          </span>
        </span>
        <button
          type="button"
          onClick={() => start(async () => void (await removePromoCode()))}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-success hover:bg-success/10"
          aria-label="Remove promo code"
          disabled={pending}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await applyPromoCode(code);
          if (res.ok) {
            toast.success(res.message ?? "Code applied");
            setCode("");
          } else setError(res.error);
        });
      }}
    >
      <label htmlFor="promo" className="text-sm font-medium">
        Promo code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="promo"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="e.g. WELCOME10"
          aria-invalid={!!error}
          aria-describedby={error ? "promo-error" : "promo-hint"}
          className="h-10 min-w-0 flex-1 rounded-md border-2 border-line-strong bg-surface px-3 text-sm uppercase placeholder:normal-case placeholder:text-ink-subtle focus:border-ink focus:outline-none focus:ring-3 focus:ring-accent/15 aria-[invalid=true]:border-danger"
        />
        <Button type="submit" variant="outline" size="sm" className="h-10" loading={pending} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error ? (
        <p id="promo-error" className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p id="promo-hint" className="mt-1.5 text-xs text-ink-subtle">
          Try WELCOME10, FREESHIP, VANIK250 or DIWALI15.
        </p>
      )}
    </form>
  );
}
