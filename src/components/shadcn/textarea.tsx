import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-base border-2 border-border bg-secondary-background px-3.5 py-2.5 text-sm font-medium leading-relaxed text-foreground selection:bg-main selection:text-main-foreground placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-soft/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
