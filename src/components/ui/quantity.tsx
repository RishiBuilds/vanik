"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-11";
  const btn = cn(
    "inline-flex items-center justify-center text-ink transition-colors hover:bg-main disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "w-8" : "w-10",
  );
  return (
    <div className={cn("inline-flex items-stretch overflow-hidden rounded-base border-2 border-border bg-secondary-background", h)} role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={cn("w-10 border-x-2 border-border bg-transparent text-center font-heading text-sm font-bold tabular-nums focus:outline-none", size === "sm" && "w-9")}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.round(n))));
        }}
      />
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
