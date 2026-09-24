import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="6" className="fill-main stroke-black" strokeWidth="2" />
      <path d="M9 10.5 16 23l7-12.5" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="stroke-black" />
      <circle cx="23.5" cy="8.5" r="2.6" className="fill-accent stroke-black" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className, href = "/", suffix }: { className?: string; href?: string; suffix?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 rounded-md", className)} aria-label="Vanik home">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-display text-[1.5rem] font-bold leading-none tracking-display text-ink">vanik</span>
      {suffix && (
        <span className="ml-0.5 rounded-base border-2 border-border bg-accent px-1.5 py-0.5 text-2xs font-bold uppercase tracking-eyebrow text-on-accent">
          {suffix}
        </span>
      )}
    </Link>
  );
}
