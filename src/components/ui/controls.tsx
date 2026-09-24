"use client";

import { RadioGroup as RRadio } from "radix-ui";
import { Checkbox as ShadcnCheckbox } from "@/components/shadcn/checkbox";
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { Switch as ShadcnSwitch } from "@/components/shadcn/switch";
import { cn } from "@/lib/utils";

export const Checkbox = ShadcnCheckbox;
export const Switch = ShadcnSwitch;
export const RadioGroup = ShadcnRadioGroup;
export const Radio = RadioGroupItem;

export function RadioCard({
  value,
  children,
  className,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <RRadio.Item
      value={value}
      disabled={disabled}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-base border-2 border-border bg-secondary-background p-4 text-left transition-all hover:bg-muted data-[state=checked]:bg-main/25 data-[state=checked]:shadow-shadow disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary-background group-data-[state=checked]:bg-main">
        <RRadio.Indicator className="size-2 rounded-full bg-ink" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </RRadio.Item>
  );
}
