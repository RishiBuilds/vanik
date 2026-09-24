"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, TriangleAlert, X } from "lucide-react";
import { uploadProductImage } from "@/lib/actions/vendor-products";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/misc";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES, isOptimizable } from "./shared";

export type FormImage = { key: string; url: string; alt?: string };
type Upload = { key: string; name: string; preview: string };

export function MediaManager({
  images,
  onChange,
  error,
  title,
}: {
  images: FormImage[];
  onChange: (updater: (prev: FormImage[]) => FormImage[]) => void;
  error?: string;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const remaining = MAX_IMAGES - images.length - uploads.length;

  const addFiles = (files: File[]) => {
    const errs: string[] = [];
    const accepted: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) errs.push(`${f.name}: use JPG, PNG, WebP, AVIF or GIF.`);
      else if (f.size > MAX_IMAGE_BYTES) errs.push(`${f.name} is larger than 5 MB.`);
      else if (accepted.length >= remaining) errs.push(`${f.name}: you can add up to ${MAX_IMAGES} images.`);
      else accepted.push(f);
    }
    setErrors(errs);
    for (const file of accepted) {
      const up: Upload = { key: crypto.randomUUID(), name: file.name, preview: URL.createObjectURL(file) };
      setUploads((u) => [...u, up]);
      const fd = new FormData();
      fd.set("file", file);
      uploadProductImage(fd)
        .then((r) => {
          if (r.ok) onChange((prev) => [...prev, { key: up.key, url: r.url, alt: "" }]);
          else setErrors((e) => [...e, r.error]);
        })
        .catch(() => setErrors((e) => [...e, `${file.name}: upload failed. Check your connection and try again.`]))
        .finally(() => {
          setUploads((u) => u.filter((x) => x.key !== up.key));
          URL.revokeObjectURL(up.preview);
        });
    }
  };

  const move = (from: number, to: number) =>
    onChange((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Product images">
        {images.map((img, i) => (
          <li
            key={img.key}
            draggable
            onDragStart={(e) => {
              setDragIndex(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (dragIndex !== null) e.preventDefault();
            }}
            onDrop={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              e.stopPropagation();
              move(dragIndex, i);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "group relative aspect-square cursor-grab overflow-hidden rounded-lg border-2 bg-muted active:cursor-grabbing",
              i === 0 ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-line",
              dragIndex === i && "opacity-40",
            )}
          >
            <Image
              src={img.url}
              alt={img.alt || `${title || "Product"} image ${i + 1}`}
              fill
              sizes="(min-width: 1280px) 12vw, (min-width: 640px) 20vw, 45vw"
              className="object-cover"
              unoptimized={!isOptimizable(img.url)}
              draggable={false}
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-2xs font-semibold text-ink-inverse">Primary</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-linear-to-t from-black/60 to-transparent p-1.5 pt-6 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <TileButton label={`Move image ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowLeft />
                </TileButton>
                <TileButton label={`Move image ${i + 1} later`} disabled={i === images.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowRight />
                </TileButton>
              </div>
              <div className="flex gap-1">
                {i > 0 && (
                  <TileButton label={`Make image ${i + 1} the primary image`} onClick={() => move(i, 0)}>
                    <Star />
                  </TileButton>
                )}
                <TileButton label={`Remove image ${i + 1}`} onClick={() => onChange((prev) => prev.filter((x) => x.key !== img.key))}>
                  <Trash2 />
                </TileButton>
              </div>
            </div>
          </li>
        ))}
        {uploads.map((u) => (
          <li key={u.key} className="relative aspect-square overflow-hidden rounded-lg border-2 border-line bg-muted" aria-live="polite">

            <img src={u.preview} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/40 p-2 text-center">
              <Spinner />
              <span className="line-clamp-1 text-2xs font-medium text-ink">Uploading {u.name}</span>
            </div>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                if (dragIndex !== null) return;
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (dragIndex !== null) return;
                e.preventDefault();
                setDragOver(false);
                addFiles([...e.dataTransfer.files]);
              }}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-center text-ink-muted transition-colors hover:border-ink/40 hover:bg-muted/60 hover:text-ink",
                dragOver ? "border-accent bg-accent-soft/50 text-accent-ink" : "border-line-strong",
                error && images.length === 0 && "border-danger",
              )}
            >
              <ImagePlus className="size-6" strokeWidth={1.5} aria-hidden />
              <span className="text-sm font-medium">{images.length ? "Add images" : "Upload images"}</span>
              <span className="text-2xs text-ink-subtle">Drop files or click · 5 MB max</span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload product images"
        onChange={(e) => {
          addFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-ink-subtle">
        JPG, PNG, WebP, AVIF or GIF · up to {MAX_IMAGES} images. The first image is the primary photo — drag tiles or use the arrows to reorder.
      </p>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {errors.length > 0 && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border-2 border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <ul className="flex-1 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setErrors([])} className="-mr-1 inline-flex size-6 items-center justify-center rounded-sm hover:bg-danger/10" aria-label="Dismiss upload errors">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function TileButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-7 items-center justify-center rounded-md bg-surface/95 text-ink shadow-sm transition-colors hover:bg-surface disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
