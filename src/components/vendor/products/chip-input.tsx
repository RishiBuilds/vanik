"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChipInput({
  id,
  values,
  onChange,
  placeholder,
  max = 20,
  maxLength = 40,
  normalize,
  className,
  invalid,
  describedBy,
  label,
}: {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  max?: number;
  maxLength?: number;
  normalize?: (s: string) => string;
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => (normalize ? normalize(s.trim()) : s.trim()).slice(0, maxLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    for (const part of parts) {
      if (next.length >= max) break;
      if (!next.some((x) => x.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    onChange(next);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-md border-2 border-line-strong bg-surface px-2 py-1.5 shadow-xs transition-[border-color,box-shadow] focus-within:border-ink focus-within:ring-3 focus-within:ring-accent/15 hover:border-ink/30",
        invalid && "border-danger focus-within:ring-danger/15",
        className,
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus();
      }}
    >
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className="inline-flex h-7 items-center gap-1 rounded-sm bg-muted pl-2.5 pr-1 text-sm text-ink">
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="inline-flex size-5 items-center justify-center rounded-xs text-ink-subtle hover:bg-sunken hover:text-ink"
            aria-label={`Remove ${v}`}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        disabled={values.length >= max}
        onChange={(e) => {
          const val = e.target.value;
          if (val.includes(",")) commit(val);
          else setDraft(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={values.length >= max ? `Limit of ${max} reached` : values.length ? "" : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-ink-subtle disabled:cursor-not-allowed"
      />
    </div>
  );
}
