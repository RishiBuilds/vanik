"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = DropdownMenu;
export const DropdownTrigger = DropdownMenuTrigger;

export function DropdownContent({ className, align = "end", ...props }: React.ComponentProps<typeof DropdownMenuContent>) {
  return <DropdownMenuContent align={align} sideOffset={8} className={cn("min-w-52 p-1.5", className)} {...props} />;
}

export function DropdownItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & { destructive?: boolean }) {
  return (
    <DropdownMenuItem
      variant={destructive ? "destructive" : "default"}
      className={cn(
        "h-9 cursor-pointer font-medium [&_svg]:size-4",
        destructive && "text-danger focus:bg-danger-soft focus:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel className={cn("px-2.5 pb-1.5 pt-1 text-xs font-bold uppercase tracking-eyebrow text-ink-muted", className)} {...props} />;
}

export function DropdownSeparator() {
  return <DropdownMenuSeparator className="-mx-1.5 my-1.5 h-0.5 bg-border" />;
}
