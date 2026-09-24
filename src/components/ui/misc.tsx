import Image from "next/image";
import { Star } from "lucide-react";
import { cn, formatMoney, initials } from "@/lib/utils";
import { Skeleton as ShadcnSkeleton } from "@/components/shadcn/skeleton";
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Progress } from "@/components/shadcn/progress";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <ShadcnSkeleton className={className} {...props} />;
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? "w-px self-stretch bg-line" : "h-px w-full bg-line", className)} />;
}

export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <ShadcnAvatar className={cn("items-center justify-center bg-main font-heading font-bold text-main-foreground", className)} style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}>
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized={src.endsWith(".svg") || (!src.startsWith("https://images.unsplash.com/") && !src.startsWith("/"))} />
      ) : (
        <AvatarFallback className="bg-main text-main-foreground">{initials(name)}</AvatarFallback>
      )}
    </ShadcnAvatar>
  );
}

export function Rating({
  value,
  count,
  size = "sm",
  className,
  showValue,
}: {
  value: number;
  count?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
  showValue?: boolean;
}) {
  const px = size === "xs" ? "size-3" : size === "sm" ? "size-3.5" : "size-[1.125rem]";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-px" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className={cn("relative", px)}>
              <Star className={cn("absolute inset-0 text-sunken", px)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("text-main", px)} fill="currentColor" stroke="var(--line)" strokeWidth={1.5} />
              </span>
            </span>
          );
        })}
      </span>
      {showValue && <span className="text-xs font-medium text-ink">{value.toFixed(1)}</span>}
      {count != null && <span className="text-xs text-ink-subtle">({count})</span>}
    </span>
  );
}

export function Price({
  cents,
  compareAt,
  className,
  size = "md",
}: {
  cents: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const onSale = compareAt != null && compareAt > cents;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-heading font-bold tabular-nums tracking-tightish",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
          onSale && "text-accent",
        )}
      >
        {formatMoney(cents)}
      </span>
      {onSale && (
        <>
          <span className={cn("tabular-nums text-ink-subtle line-through", size === "lg" ? "text-base" : "text-xs")}>
            {formatMoney(compareAt)}
          </span>
          {size === "lg" && (
            <span className="text-sm font-medium text-accent">Save {Math.round((1 - cents / compareAt) * 100)}%</span>
          )}
        </>
      )}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-line-strong border-t-ink", className)}
      role="status"
      aria-label="Loading"
    />
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border-2 border-border bg-secondary-background px-1 font-mono text-2xs font-bold text-ink">
      {children}
    </kbd>
  );
}

export function ProgressBar({ value, className, tone = "ink" }: { value: number; className?: string; tone?: "ink" | "accent" | "warning" | "danger" | "success" }) {
  return (
    <Progress
      value={Math.max(0, Math.min(100, value * 100))}
      className={cn("h-3", className)}
      indicatorClassName={cn(
        tone === "ink" && "bg-main",
        tone === "accent" && "bg-main",
        tone === "warning" && "bg-warning-soft",
        tone === "danger" && "bg-danger-soft",
        tone === "success" && "bg-success-soft",
      )}
    />
  );
}
