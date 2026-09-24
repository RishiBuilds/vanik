"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyText({ value, className, label = "Copy" }: { value: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={cn("inline-flex items-center gap-1.5 rounded-sm font-mono transition-colors hover:text-ink", className)}
      aria-label={`${label} ${value}`}
      title={copied ? "Copied" : label}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />} {value}
    </button>
  );
}
