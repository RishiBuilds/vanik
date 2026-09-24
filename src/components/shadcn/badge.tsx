import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-base border-2 border-border font-heading font-bold [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground",
        neutral: "bg-secondary-background text-foreground",
        muted: "bg-muted text-ink",
        solid: "bg-ink text-ink-inverse",
        accent: "bg-accent text-on-accent",
        success: "bg-success-soft text-ink",
        warning: "bg-warning-soft text-ink",
        danger: "bg-danger-soft text-ink",
        info: "bg-info-soft text-ink",
        outline: "bg-transparent text-ink",
      },
      size: {
        sm: "h-5 px-1.5 text-2xs [&>svg]:size-3",
        md: "h-6 px-2 text-xs [&>svg]:size-3",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
