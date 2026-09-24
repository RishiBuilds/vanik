"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, LayoutGrid, Search, Store, X } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { Kbd } from "@/components/ui/misc";

type Suggestions = {
  products: { slug: string; title: string; price: number; image: string | null; storeName: string }[];
  stores: { slug: string; name: string; logo: string | null; tagline: string }[];
  categories: { slug: string; name: string }[];
};

type Option = { key: string; href: string; kind: "query" | "product" | "store" | "category"; label: string };

const POPULAR = ["stoneware mug", "headphones", "linen shirt", "candle", "sneakers", "monstera"];

export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{ q: string; data: Suggestions } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const term = q.trim();
  const data = term.length >= 2 && result?.q === term ? result.data : null;
  const loading = term.length >= 2 && result?.q !== term;

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setResult({ q: term, data: await res.json() });
      } catch {

      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement)?.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const options: Option[] = useMemo(() => {
    if (term.length < 2) {
      return POPULAR.map((p) => ({ key: `pop-${p}`, href: `/search?q=${encodeURIComponent(p)}`, kind: "query", label: p }));
    }
    return [
      { key: "q", href: `/search?q=${encodeURIComponent(term)}`, kind: "query" as const, label: term },
      ...(data?.categories ?? []).map((c) => ({ key: `c-${c.slug}`, href: `/c/${c.slug}`, kind: "category" as const, label: c.name })),
      ...(data?.products ?? []).map((p) => ({ key: `p-${p.slug}`, href: `/p/${p.slug}`, kind: "product" as const, label: p.title })),
      ...(data?.stores ?? []).map((s) => ({ key: `s-${s.slug}`, href: `/s/${s.slug}`, kind: "store" as const, label: s.name })),
    ];
  }, [term, data]);

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active].href);
      else if (term) go(`/search?q=${encodeURIComponent(term)}`);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const productById = new Map((data?.products ?? []).map((p) => [`p-${p.slug}`, p]));
  const storeById = new Map((data?.stores ?? []).map((s) => [`s-${s.slug}`, s]));
  const showPanel = open && (term.length < 2 || data || loading);
  const noResults = term.length >= 2 && data && !data.products.length && !data.stores.length && !data.categories.length;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (term) go(`/search?q=${encodeURIComponent(term)}`);
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products and shops
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-ink" strokeWidth={2.5} aria-hidden />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={!!showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Search products, shops and categories"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-base border-2 border-border bg-secondary-background pl-11 pr-20 text-sm font-medium text-ink shadow-xs placeholder:text-ink-subtle transition-shadow focus:shadow-shadow focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="inline-flex size-7 items-center justify-center rounded-base text-ink hover:bg-main"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex">
              <Kbd>/</Kbd>
            </span>
          )}
        </div>
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow animate-slide-up">
          <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[70vh] overflow-y-auto p-2">
            {term.length < 2 && <li className="px-3 pb-1.5 pt-2 eyebrow" role="presentation">Popular searches</li>}
            {options.map((o, i) => {
              const prod = productById.get(o.key);
              const store = storeById.get(o.key);
              const prev = options[i - 1];
              const heading =
                term.length >= 2 && prev?.kind !== o.kind && o.kind !== "query"
                  ? { category: "Categories", product: "Products", store: "Shops" }[o.kind]
                  : null;
              return (
                <li key={o.key} role="presentation">
                  {heading && <div className="px-3 pb-1.5 pt-3 eyebrow">{heading}</div>}
                  <a
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    href={o.href}
                    onMouseEnter={() => setActive(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      go(o.href);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-base border-2 border-transparent px-3 py-2 text-sm text-ink transition-colors",
                      active === i && "border-border bg-main text-main-foreground",
                    )}
                  >
                    {o.kind === "query" && (
                      <>
                        <Search className="size-4 shrink-0 text-ink-subtle" />
                        <span className="flex-1 truncate">
                          {term.length >= 2 ? (
                            <>
                              Search for <span className="font-medium">“{o.label}”</span>
                            </>
                          ) : (
                            o.label
                          )}
                        </span>
                        <ArrowUpRight className="size-4 text-ink-subtle" />
                      </>
                    )}
                    {o.kind === "category" && (
                      <>
                        <LayoutGrid className="size-4 shrink-0 text-ink-subtle" />
                        <span className="flex-1 truncate">{o.label}</span>
                      </>
                    )}
                    {o.kind === "product" && prod && (
                      <>
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-base border-2 border-border bg-muted">
                          {prod.image && <Image src={prod.image} alt="" fill sizes="40px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{prod.title}</span>
                          <span className="block truncate text-xs text-ink-subtle">{prod.storeName}</span>
                        </span>
                        <span className="text-sm tabular-nums text-ink-muted">{formatMoney(prod.price)}</span>
                      </>
                    )}
                    {o.kind === "store" && store && (
                      <>
                        <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                          {store.logo ? <Image src={store.logo} alt="" fill sizes="40px" className="object-cover" /> : <Store className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{store.name}</span>
                          <span className="block truncate text-xs text-ink-subtle">{store.tagline}</span>
                        </span>
                      </>
                    )}
                  </a>
                </li>
              );
            })}
            {noResults && (
              <li role="presentation" className="px-3 py-3 text-sm text-ink-muted">
                No quick matches — press Enter to search everything.
              </li>
            )}
            {loading && !data && term.length >= 2 && (
              <li role="presentation" className="flex items-center gap-3 px-3 py-3">
                <span className="size-10 animate-pulse rounded-md bg-muted" />
                <span className="h-3 w-40 animate-pulse rounded bg-muted" />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
