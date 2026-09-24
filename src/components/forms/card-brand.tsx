import { Banknote, Landmark, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";


export function CardBrandMark({ brand, className }: { brand: string; className?: string }) {
  const base = "inline-flex h-6 w-10 shrink-0 items-center justify-center rounded-[5px] text-[0.55rem] font-bold uppercase tracking-wide";
  switch (brand) {
    case "visa":
      return <span className={cn(base, "bg-[#1a1f71] text-white italic", className)}>Visa</span>;
    case "mastercard":
      return (
        <span className={cn(base, "bg-[#111] gap-0", className)} aria-label="Mastercard">
          <span className="size-3.5 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 size-3.5 rounded-full bg-[#f79e1b] mix-blend-screen" />
        </span>
      );
    case "amex":
      return <span className={cn(base, "bg-[#2e77bc] text-white", className)}>Amex</span>;
    case "rupay":
      return <span className={cn(base, "bg-[#0f4c81] text-white italic normal-case", className)}>RuPay</span>;
    case "upi":
      return <span className={cn(base, "bg-[#097939] text-white", className)}>UPI</span>;
    case "netbanking":
      return (
        <span className={cn(base, "bg-info-soft text-info", className)}>
          <Landmark className="size-3.5" />
        </span>
      );
    case "vanikpay":
      return (
        <span className={cn(base, "bg-accent text-on-accent normal-case", className)}>
          <Wallet className="size-3.5" />
        </span>
      );
    case "cod":
      return (
        <span className={cn(base, "bg-muted text-ink", className)}>
          <Banknote className="size-4" />
        </span>
      );
    default:
      return <span className={cn(base, "bg-muted text-ink-muted", className)}>Card</span>;
  }
}

export function brandLabel(brand: string) {
  return (
    { visa: "Visa", mastercard: "Mastercard", amex: "American Express", rupay: "RuPay", upi: "UPI", netbanking: "Net banking", vanikpay: "Vanik Wallet", cod: "Cash on delivery" }[
      brand
    ] ?? brand
  );
}
