import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOptimizable } from "./shared";

export function ProductThumb({ src, alt = "", size = 44, className }: { src: string | null; alt?: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-line bg-muted", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size * 2}px`} className="object-cover" unoptimized={!isOptimizable(src)} />
      ) : (
        <ImageOff className="size-4 text-ink-subtle" strokeWidth={1.5} aria-hidden />
      )}
    </span>
  );
}
