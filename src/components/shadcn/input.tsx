import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-base border-2 border-border bg-secondary-background px-3.5 py-2 text-sm font-medium text-foreground selection:bg-main selection:text-main-foreground file:border-0 file:bg-transparent file:font-heading file:text-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-soft/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
