import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Rating } from "@/components/ui/misc";

export type StoreCardProps = {
  slug: string;
  name: string;
  tagline: string;
  logo: string | null;
  banner: string | null;
  location: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  productCount: number;
  verified: boolean;
  previewImages: string[];
};

export function StoreLogo({ src, name, size = 56, className }: { src: string | null; name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-main font-display font-bold text-ink", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? <Image src={src} alt={`${name} logo`} fill sizes={`${size}px`} className="object-cover" /> : name[0]}
    </span>
  );
}

export function StoreCard({ store, className }: { store: StoreCardProps; className?: string }) {
  const previews = store.previewImages.slice(0, 3);
  return (
    <Link
      href={`/s/${store.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow lift",
        className,
      )}
    >
      <div className="grid h-40 grid-cols-3 gap-0.5 border-b-2 border-border bg-line">
        {previews.map((src, i) => (
          <div key={i} className={cn("relative overflow-hidden bg-muted", i === 0 && "col-span-2 row-span-2")}>
            <Image src={src} alt="" fill sizes="240px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
        ))}
        {previews.length < 3 &&
          Array.from({ length: 3 - previews.length }).map((_, i) => <div key={`e${i}`} className="bg-muted" />)}
      </div>
      <div className="relative flex flex-1 flex-col px-5 pb-5">
        <StoreLogo src={store.logo} name={store.name} size={52} className="-mt-7" />
        <div className="mt-2.5 flex items-center gap-1.5">
          <h3 className="truncate font-heading text-base font-bold tracking-tightish">{store.name}</h3>
          {store.verified && <BadgeCheck className="size-4 shrink-0 text-info" aria-label="Verified shop" />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{store.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-ink-subtle">
          {store.reviewCount > 0 && <Rating value={store.rating} size="xs" showValue />}
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {store.location}
          </span>
          <span>{formatNumber(store.productCount)} items</span>
        </div>
      </div>
    </Link>
  );
}
