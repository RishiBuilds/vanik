import { ImageOff } from "lucide-react";

export function ProductImagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,var(--sunken),var(--muted))] p-4 text-center">
      <ImageOff className="size-6 text-ink-subtle" strokeWidth={1.5} aria-hidden />
      <span className="line-clamp-2 font-display font-bold text-sm text-ink-muted">{title}</span>
    </div>
  );
}
