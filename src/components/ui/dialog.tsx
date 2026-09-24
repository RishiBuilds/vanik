"use client";

import {
  Dialog as ShadcnDialog,
  DialogClose as ShadcnDialogClose,
  DialogContent as ShadcnDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger as ShadcnDialogTrigger,
} from "@/components/shadcn/dialog";
import { SheetContent as ShadcnSheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/shadcn/sheet";
import { cn } from "@/lib/utils";

export const Dialog = ShadcnDialog;
export const DialogTrigger = ShadcnDialogTrigger;
export const DialogClose = ShadcnDialogClose;

export function DialogContent({
  title,
  description,
  children,
  className,
  size = "md",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <ShadcnDialogContent
      className={cn(
        "max-h-[92dvh] gap-0 overflow-y-auto p-0",
        size === "sm" && "sm:max-w-md",
        size === "md" && "sm:max-w-lg",
        size === "lg" && "sm:max-w-2xl",
        className,
      )}
    >
      <DialogHeader className="sticky top-0 z-10 border-b-2 border-border bg-main px-5 py-4 pr-14 text-left sm:px-6">
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription className="text-sm text-ink">{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{typeof title === "string" ? title : "Dialog"}</DialogDescription>
        )}
      </DialogHeader>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </ShadcnDialogContent>
  );
}

export function SheetContent({
  title,
  side = "right",
  children,
  className,
  footer,
}: {
  title: React.ReactNode;
  side?: "left" | "right";
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <ShadcnSheetContent side={side} className={cn("w-[88vw] gap-0 bg-canvas sm:max-w-sm", className)}>
      <SheetHeader className="h-16 shrink-0 justify-center border-b-2 border-border bg-main px-5">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription className="sr-only">{typeof title === "string" ? title : "Panel"}</SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto">{children}</div>
      {footer && <div className="shrink-0 border-t-2 border-border p-4">{footer}</div>}
    </ShadcnSheetContent>
  );
}
