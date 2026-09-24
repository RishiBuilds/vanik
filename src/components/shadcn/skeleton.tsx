import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-base border-2 border-border/15 bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
