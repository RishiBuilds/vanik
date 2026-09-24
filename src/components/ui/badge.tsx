import { Badge as ShadcnBadge, badgeVariants } from "@/components/shadcn/badge";

type Tone = "neutral" | "solid" | "accent" | "success" | "warning" | "danger" | "info" | "outline" | "main";

const TONE_TO_VARIANT = {
  neutral: "muted",
  solid: "solid",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  outline: "outline",
  main: "default",
} as const;

export { badgeVariants };

export function Badge({
  className,
  tone = "neutral",
  size = "md",
  dot,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone | null; size?: "sm" | "md" | null; dot?: boolean }) {
  return (
    <ShadcnBadge variant={TONE_TO_VARIANT[tone ?? "neutral"]} size={size ?? "md"} className={className} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </ShadcnBadge>
  );
}
