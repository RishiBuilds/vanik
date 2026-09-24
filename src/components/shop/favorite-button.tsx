"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  initial,
  className,
  variant = "overlay",
  title,
}: {
  productId: string;
  initial: boolean;
  className?: string;
  variant?: "overlay" | "outline";
  title?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [fav, setFav] = useOptimistic(initial);
  const [, start] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      setFav(!fav);
      const res = await toggleFavorite(productId);
      if (!res.ok) {
        if (res.error === "auth") {
          toast("Sign in to save favorites", {
            action: { label: "Sign in", onClick: () => router.push(`/sign-in?next=${encodeURIComponent(pathname)}`) },
          });
        } else toast.error(res.error);
        return;
      }
      if (res.data?.favorited) toast.success(title ? `Saved “${title}” to your wishlist` : "Saved to wishlist");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={fav}
      aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex items-center justify-center transition-[background-color,transform,color] duration-150 active:scale-90",
        variant === "overlay" &&
          "size-9 rounded-base border-2 border-border bg-secondary-background text-ink shadow-xs hover:bg-main",
        variant === "outline" && "size-12 rounded-base border-2 border-border bg-secondary-background shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        className,
      )}
    >
      <Heart
        className={cn("size-[1.125rem] transition-colors", fav ? "fill-accent text-ink" : "text-ink")}
        strokeWidth={2.25}
      />
    </button>
  );
}
