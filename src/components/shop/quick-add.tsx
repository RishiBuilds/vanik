"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/lib/actions/cart";
import { cn } from "@/lib/utils";

const cls =
  "inline-flex h-9 items-center gap-1.5 rounded-base border-2 border-border bg-main px-3.5 font-heading text-xs font-bold text-main-foreground shadow-xs transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none";

export function QuickAdd({
  variantId,
  href,
  hasOptions,
  className,
}: {
  variantId: string | null;
  href: string;
  hasOptions: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (hasOptions || !variantId) {
    return (
      <Link href={href} className={cn(cls, className)} tabIndex={-1}>
        Choose options
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cn(cls, pending && "opacity-70", className)}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await addToCart({ variantId, quantity: 1 });
          if (res.ok) {
            toast.success(res.message ?? "Added to cart", { action: { label: "View cart", onClick: () => router.push("/cart") } });
          } else toast.error(res.error);
        });
      }}
    >
      <Plus className="size-3.5" /> {pending ? "Adding…" : "Quick add"}
    </button>
  );
}
