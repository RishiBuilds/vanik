import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { Input as ShadcnInput } from "@/components/shadcn/input";
import { Textarea as ShadcnTextarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

export function Input(props: React.ComponentProps<"input">) {
  return <ShadcnInput {...props} />;
}

export function Textarea(props: React.ComponentProps<"textarea">) {
  return <ShadcnTextarea {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-11 w-full appearance-none rounded-base border-2 border-border bg-secondary-background pl-3.5 pr-10 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-danger"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink" strokeWidth={2.5} aria-hidden />
    </div>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("font-heading text-sm font-bold text-ink", className)} {...props} />;
}

type FieldProps = {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | string[] | null;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
};

export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const err = Array.isArray(error) ? error[0] : error;
  const describedBy = err ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="flex items-baseline justify-between">
        <span>{label}</span>
        {optional && <span className="font-sans text-xs font-medium text-ink-subtle">Optional</span>}
      </Label>
      {children({ id, "aria-invalid": err ? true : undefined, "aria-describedby": describedBy })}
      {err ? (
        <p id={`${id}-error`} className="text-xs font-semibold text-danger" role="alert">
          {err}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-base border-2 border-border bg-danger-soft px-3.5 py-2.5 text-sm font-semibold text-ink shadow-xs">
      {message}
    </div>
  );
}
