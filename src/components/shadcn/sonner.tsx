"use client"

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      gap={12}
      icons={{
        success: <CircleCheckIcon className="size-[1.125rem] text-success" />,
        info: <InfoIcon className="size-[1.125rem] text-info" />,
        warning: <TriangleAlertIcon className="size-[1.125rem] text-warning" />,
        error: <OctagonXIcon className="size-[1.125rem] text-danger" />,
        loading: <Loader2Icon className="size-[1.125rem] animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[calc(100vw-2rem)] items-start gap-3 rounded-base border-2 border-border bg-secondary-background px-4 py-3.5 font-sans text-sm text-foreground shadow-shadow sm:w-[356px]",
          title: "font-heading font-bold leading-snug",
          description: "mt-0.5 text-xs text-ink-muted",
          actionButton:
            "ml-auto shrink-0 rounded-base border-2 border-border bg-main px-2.5 py-1 font-heading text-xs font-bold text-main-foreground",
          cancelButton: "shrink-0 rounded-base px-2 py-1 text-xs text-ink-muted hover:bg-muted",
          icon: "mt-px",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
