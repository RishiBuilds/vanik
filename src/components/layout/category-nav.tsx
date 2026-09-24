"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { CategoryNode } from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";

const SHORT: Record<string, string> = {
  "home-living": "Home",
  "furniture-lighting": "Furniture",
  "bags-accessories": "Bags",
  beauty: "Beauty",
  tech: "Tech",
  "coffee-kitchen": "Kitchen",
  "plants-outdoor": "Outdoor",
};

export function CategoryNav({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();
  return (
    <div className="hidden border-t-2 border-border lg:block">
      <NavigationMenu.Root className="relative" delayDuration={80}>
        <NavigationMenu.List className="container-page flex h-11 items-center gap-1">
          {categories.map((cat) => {
            const activeCat = pathname === `/c/${cat.slug}` || cat.children.some((ch) => pathname === `/c/${ch.slug}`);
            return (
              <NavigationMenu.Item key={cat.id}>
                <NavigationMenu.Trigger
                  className={cn(
                    "group inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-base border-2 border-transparent px-2.5 font-heading text-[0.8125rem] font-bold text-ink transition-colors hover:border-border hover:bg-main data-[state=open]:border-border data-[state=open]:bg-main",
                    activeCat && "border-border bg-secondary-background",
                  )}
                >
                  {SHORT[cat.slug] ?? cat.name}
                  <ChevronDown className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute left-0 top-0 w-full data-[motion^=from-]:animate-fade-in">
                  <div className="container-page grid grid-cols-[1fr_1fr_1.2fr] gap-8 py-7">
                    <div>
                      <p className="eyebrow mb-3">{cat.name}</p>
                      <ul className="space-y-0.5">
                        {cat.children.map((ch) => (
                          <li key={ch.id}>
                            <NavigationMenu.Link asChild>
                              <Link
                                href={`/c/${ch.slug}`}
                                className="block rounded-md px-2 py-1.5 -mx-2 text-sm text-ink transition-colors hover:bg-muted"
                              >
                                {ch.name}
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        ))}
                        <li>
                          <NavigationMenu.Link asChild>
                            <Link
                              href={`/c/${cat.slug}`}
                              className="-mx-2 mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft"
                            >
                              Shop all {cat.name} <ArrowRight className="size-3.5" />
                            </Link>
                          </NavigationMenu.Link>
                        </li>
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-3 self-start">
                      {cat.children.slice(0, 4).map((ch) => (
                        <NavigationMenu.Link asChild key={ch.id}>
                          <Link href={`/c/${ch.slug}`} className="group/tile -m-2 flex items-center gap-3 rounded-base border-2 border-transparent p-2 hover:border-border hover:bg-main">
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-base border-2 border-border bg-muted">
                              {ch.image && <Image src={ch.image} alt="" fill sizes="48px" className="object-cover" />}
                            </span>
                            <span className="text-sm font-medium">{ch.name}</span>
                          </Link>
                        </NavigationMenu.Link>
                      ))}
                    </div>
                    <NavigationMenu.Link asChild>
                      <Link href={`/c/${cat.slug}`} className="group/hero relative block aspect-[16/9] overflow-hidden rounded-base border-2 border-border bg-muted shadow-shadow">
                        {cat.image && (
                          <Image
                            src={cat.image}
                            alt=""
                            fill
                            sizes="400px"
                            className="object-cover transition-transform duration-500 group-hover/hero:scale-[1.03]"
                          />
                        )}
                        <span className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                        <span className="absolute inset-x-4 bottom-4 text-white">
                          <span className="block font-display font-bold text-xl">{cat.name}</span>
                          <span className="mt-0.5 block text-xs text-white/80">{cat.description}</span>
                        </span>
                      </Link>
                    </NavigationMenu.Link>
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            );
          })}
          <NavigationMenu.Item className="ml-auto">
            <NavigationMenu.Link asChild>
              <Link href="/stores" className="inline-flex h-8 items-center rounded-base border-2 border-transparent px-2.5 font-heading text-[0.8125rem] font-bold text-ink hover:border-border hover:bg-main">
                All shops
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild>
              <Link href="/search?sale=1" className="inline-flex h-8 items-center rounded-base border-2 border-border bg-accent px-2.5 font-heading text-[0.8125rem] font-bold text-on-accent shadow-xs">
                Sale
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <div className="absolute inset-x-0 top-full">
          <NavigationMenu.Viewport className="relative h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden border-y-2 border-border bg-secondary-background data-[state=open]:animate-fade-in" />
        </div>
      </NavigationMenu.Root>
    </div>
  );
}
