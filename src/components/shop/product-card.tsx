import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/shadcn/card";
import { Price, Rating } from "@/components/ui/misc";
import { FavoriteButton } from "./favorite-button";
import { QuickAdd } from "./quick-add";
import { ProductImagePlaceholder } from "./product-image";

const NEW_WINDOW = 21 * 86_400_000;

function badgeFor(p: ProductCardData) {
  if (!p.inStock) return <Badge tone="solid" size="sm">Sold out</Badge>;
  if (p.compareAtPrice && p.compareAtPrice > p.price)
    return <Badge tone="accent" size="sm">−{Math.round((1 - p.price / p.compareAtPrice) * 100)}%</Badge>;
  if (Date.now() - new Date(p.createdAt).getTime() < NEW_WINDOW) return <Badge tone="info" size="sm">New</Badge>;
  if (p.tags.includes("bestseller")) return <Badge tone="main" size="sm">Bestseller</Badge>;
  return null;
}

export function ProductCard({
  product: p,
  favorited = false,
  priority,
  className,
}: {
  product: ProductCardData;
  favorited?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const href = `/p/${p.slug}`;
  const badge = badgeFor(p);
  return (
    <Card className={cn("group relative gap-0 overflow-hidden lift", className)}>
      <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-border bg-muted">
        <Link href={href} className="absolute inset-0" aria-label={p.title}>
          {p.image ? (
            <>
              <Image
                src={p.image}
                alt={p.title}
                fill
                priority={priority}
                sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                className={cn(
                  "object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.03]",
                  p.image2 && "group-hover:opacity-0",
                  !p.inStock && "opacity-70",
                )}
              />
              {p.image2 && (
                <Image
                  src={p.image2}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                  className="object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <ProductImagePlaceholder title={p.title} />
          )}
        </Link>
        {badge && <div className="pointer-events-none absolute left-3 top-3">{badge}</div>}
        <FavoriteButton productId={p.id} initial={favorited} title={p.title} className="absolute right-3 top-3" />
        {p.inStock && (
          <div className="absolute inset-x-3 bottom-3 hidden translate-y-2 justify-center opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 md:flex">
            <QuickAdd variantId={p.defaultVariantId} href={href} hasOptions={p.variantCount > 1} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <Link href={`/s/${p.storeSlug}`} className="w-fit text-xs font-semibold uppercase tracking-wide text-ink-muted transition-colors hover:text-accent">
          {p.storeName}
        </Link>
        <h3 className="font-heading text-sm font-bold leading-snug text-ink">
          <Link href={href} className="line-clamp-2 hover:underline hover:decoration-2 hover:underline-offset-4">
            {p.title}
          </Link>
        </h3>
        {p.reviewCount > 0 && <Rating value={p.rating} count={p.reviewCount} size="xs" />}
        <Price cents={p.price} compareAt={p.compareAtPrice} size="sm" className="mt-auto pt-1.5" />
      </div>
    </Card>
  );
}

export function ProductRow({ product: p, favorited = false }: { product: ProductCardData; favorited?: boolean }) {
  const href = `/p/${p.slug}`;
  const badge = badgeFor(p);
  return (
    <Card className="group relative flex-row gap-4 p-3 lift sm:gap-6 sm:p-4">
      <Link href={href} className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-base border-2 border-border bg-muted sm:w-44" aria-label={p.title}>
        {p.image ? (
          <Image src={p.image} alt={p.title} fill sizes="176px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <ProductImagePlaceholder title={p.title} />
        )}
        {badge && <div className="absolute left-2 top-2">{badge}</div>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/s/${p.storeSlug}`} className="w-fit text-xs text-ink-subtle hover:text-ink">
          {p.storeName}
        </Link>
        <h3 className="mt-0.5 font-heading text-base font-bold leading-snug">
          <Link href={href} className="hover:underline hover:decoration-line-strong hover:underline-offset-4">
            {p.title}
          </Link>
        </h3>
        {p.reviewCount > 0 && <Rating value={p.rating} count={p.reviewCount} size="xs" className="mt-1" />}
        <p className="mt-2 line-clamp-2 hidden text-sm text-ink-muted sm:block">{p.summary}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <Price cents={p.price} compareAt={p.compareAtPrice} />
          <div className="flex items-center gap-2">
            {p.inStock && <QuickAdd variantId={p.defaultVariantId} href={href} hasOptions={p.variantCount > 1} />}
            <FavoriteButton productId={p.id} initial={favorited} title={p.title} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProductGrid({
  products,
  favorites,
  className,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  favorites?: Set<string>;
  className?: string;
  priorityCount?: number;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} favorited={favorites?.has(p.id)} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[4/5] animate-pulse rounded-base border-2 border-border/20 bg-muted" />
      <div className="mt-3 h-3 w-20 rounded bg-muted" />
      <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
      <div className="mt-2 h-4 w-14 rounded bg-muted" />
    </div>
  );
}
