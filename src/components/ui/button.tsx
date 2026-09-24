import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { Button as ShadcnButton, buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";

export { buttonVariants };

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export function Button({ loading, disabled, asChild, children, ...props }: ButtonProps) {
  if (asChild) {
    return (
      <ShadcnButton asChild {...props}>
        {children}
      </ShadcnButton>
    );
  }
  return (
    <ShadcnButton disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="absolute animate-spin" aria-hidden />}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
    </ShadcnButton>
  );
}
