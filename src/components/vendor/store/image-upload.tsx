"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadStoreImage } from "@/lib/actions/vendor-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export function ImageUpload({
  kind,
  value,
  onChange,
  name,
  brandColor,
  label,
}: {
  kind: "logo" | "banner";
  value: string | null;
  onChange: (url: string | null) => void;
  name: string;
  brandColor: string;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Images must be 5 MB or smaller.");
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const r = await uploadStoreImage(fd);
      if (r.ok) {
        onChange(r.url);
        toast.success(`${kind === "logo" ? "Logo" : "Banner"} uploaded`);
      } else setError(r.error);
    });
    if (input.current) input.current.value = "";
  };

  const preview =
    kind === "logo" ? (
      <span
        className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-line font-display text-4xl font-bold text-white"
        style={value ? undefined : { backgroundColor: brandColor }}
      >
        {value ? <Image src={value} alt="Logo preview" fill sizes="96px" className="object-cover" /> : (name.trim()[0] ?? "V").toUpperCase()}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" aria-hidden />
          </span>
        )}
      </span>
    ) : (
      <span
        className="relative flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-line"
        style={value ? undefined : { background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}99 45%, ${brandColor}33 100%)` }}
      >
        {value ? (
          <Image src={value} alt="Banner preview" fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-white/90">
            <ImagePlus className="size-6" strokeWidth={1.5} aria-hidden />
            <span className="text-xs font-medium">1800 × 600 recommended</span>
          </span>
        )}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-6 animate-spin text-white" aria-hidden />
          </span>
        )}
      </span>
    );

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className={cn("mt-2 flex gap-4", kind === "logo" ? "items-center" : "flex-col")}>
        {preview}
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} loading={pending}>
              <Upload /> {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} disabled={pending}>
                <Trash2 /> Remove
              </Button>
            )}
          </div>
          <p className={cn("mt-2 text-xs", error ? "text-danger" : "text-ink-subtle")} role={error ? "alert" : undefined}>
            {error ?? (kind === "logo" ? "Square image, at least 240 × 240. JPG, PNG or WebP, up to 5 MB." : "Wide image shown across the top of your storefront. Up to 5 MB.")}
          </p>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label={`Upload ${kind}`}
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

export const BRAND_PRESETS = ["#a8461f", "#1c1814", "#2f6f4f", "#2b5a8a", "#6b4c9a", "#b0305c", "#8a5a00", "#3f6b6b"];

export function BrandColorPicker({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string | null }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div>
      <p className="text-sm font-medium" id="brand-color-label">
        Brand colour
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2" role="radiogroup" aria-labelledby="brand-color-label">
        {BRAND_PRESETS.map((c) => {
          const selected = value.toLowerCase() === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c}
              onClick={() => onChange(c)}
              className={cn(
                "size-8 rounded-full border-2 border-line-strong transition-transform hover:scale-110",
                selected && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
              )}
              style={{ backgroundColor: c }}
            />
          );
        })}
        <label className="ml-1 flex h-9 items-center gap-2 rounded-md border-2 border-line-strong bg-surface pl-1.5 pr-2 shadow-xs focus-within:border-ink">
          <span className="size-6 rounded-sm border-2 border-black/10" style={{ backgroundColor: valid ? value : "transparent" }} aria-hidden />
          <span className="sr-only">Custom hex colour</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.startsWith("#") ? e.target.value.slice(0, 7) : `#${e.target.value}`.slice(0, 7))}
            className="w-20 bg-transparent font-mono text-sm uppercase outline-none"
            aria-invalid={!valid || !!error ? true : undefined}
            spellCheck={false}
          />
        </label>
      </div>
      {(error || !valid) && (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error ?? "Use a 6-digit hex colour like #a8461f"}
        </p>
      )}
    </div>
  );
}
