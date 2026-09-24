"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProductImagePlaceholder } from "@/components/shop/product-image";

type Img = { id: string; url: string; alt: string };

export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[index];
  const go = (d: number) => setIndex((i) => (i + d + count) % count);

  if (!current) {
    return (
      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
        <ProductImagePlaceholder title={title} />
      </div>
    );
  }

  return (
    <div className={cn("grid min-w-0 gap-3 lg:gap-4", count > 1 && "lg:grid-cols-[4.5rem_minmax(0,1fr)]")}>
      {count > 1 && (
        <div className="scrollbar-none order-2 flex gap-2.5 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1} of ${count}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-base border-2 border-border bg-muted transition-all lg:w-full",
                i === index ? "shadow-shadow" : "opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div
        className="group relative order-1 aspect-square w-full min-w-0 overflow-hidden rounded-base border-2 border-border bg-muted shadow-shadow lg:order-2 lg:aspect-[4/5]"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        {images.map((img, i) => (
          <Image
            key={img.id}
            src={img.url}
            alt={img.alt || title}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn("object-cover transition-opacity duration-500", i === index ? "opacity-100" : "opacity-0")}
            aria-hidden={i !== index}
          />
        ))}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-xs transition-opacity hover:bg-main sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-xs transition-opacity hover:bg-main sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden" aria-hidden>
              {images.map((img, i) => (
                <span key={img.id} className={cn("h-1.5 rounded-full bg-white/90 transition-all", i === index ? "w-5" : "w-1.5 opacity-60")} />
              ))}
            </div>
          </>
        )}
        <Dialog>
          <DialogTrigger
            className="absolute bottom-3 right-3 inline-flex size-10 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-xs transition-opacity hover:bg-main sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            aria-label="Enlarge image"
          >
            <Expand className="size-4" />
          </DialogTrigger>
          <DialogContent title={title} size="lg">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image src={current.url} alt={current.alt || title} fill sizes="720px" className="object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
