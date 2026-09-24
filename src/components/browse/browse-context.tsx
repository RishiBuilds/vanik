"use client";

import { createContext, useContext, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Ctx = {
  pending: boolean;
  params: URLSearchParams;
  update: (patch: Record<string, string | string[] | null>, opts?: { keepPage?: boolean }) => void;
  toggleValue: (key: string, value: string) => void;
  clearAll: () => void;
};

const BrowseCtx = createContext<Ctx | null>(null);

const FILTER_KEYS = ["store", "color", "size", "min", "max", "rating", "stock", "sale", "category"];

export function BrowseProvider({ children, lockedKeys = [] }: { children: React.ReactNode; lockedKeys?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const push = (next: URLSearchParams) => {
    const qs = next.toString();
    start(() => router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  };

  const update: Ctx["update"] = (patch, opts) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      next.delete(k);
      if (v == null) continue;
      (Array.isArray(v) ? v : [v]).forEach((x) => x !== "" && next.append(k, x));
    }
    if (!opts?.keepPage) next.delete("page");
    push(next);
  };

  const toggleValue: Ctx["toggleValue"] = (key, value) => {
    const current = sp.getAll(key);
    update({ [key]: current.includes(value) ? current.filter((x) => x !== value) : [...current, value] });
  };

  const clearAll = () => {
    const next = new URLSearchParams(sp.toString());
    FILTER_KEYS.filter((k) => !lockedKeys.includes(k)).forEach((k) => next.delete(k));
    next.delete("page");
    push(next);
  };

  return (
    <BrowseCtx.Provider value={{ pending, params: new URLSearchParams(sp.toString()), update, toggleValue, clearAll }}>
      {children}
    </BrowseCtx.Provider>
  );
}

export function useBrowse() {
  const ctx = useContext(BrowseCtx);
  if (!ctx) throw new Error("useBrowse must be used inside BrowseProvider");
  return ctx;
}

export function BrowseResults({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useBrowse();
  return (
    <div className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)} aria-busy={pending}>
      {children}
    </div>
  );
}
