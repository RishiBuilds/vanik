import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/queries/catalog";
import { parseBrowseParams } from "@/lib/browse-params";
import { cn } from "@/lib/utils";
import { BrowseView } from "@/components/browse/browse-view";
import { Breadcrumbs } from "@/components/shop/section";

export async function generateMetadata(props: PageProps<"/c/[slug]">): Promise<Metadata> {
  const found = await getCategoryBySlug((await props.params).slug);
  return { title: found?.category.name ?? "Category", description: found?.category.description ?? undefined };
}

export default async function CategoryPage(props: PageProps<"/c/[slug]">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const found = await getCategoryBySlug(slug);
  if (!found) notFound();
  const { category, parent } = found;
  const { view, ...query } = parseBrowseParams(searchParams);
  const siblings = parent ? parent.children : category.children;
  const top = parent ?? category;

  return (
    <div className="pb-8">
      <section className="border-b-2 border-line bg-surface">
        <div className="container-page grid items-center gap-8 py-8 md:grid-cols-[1fr_auto] lg:py-10">
          <div>
            <Breadcrumbs
              items={[
                { href: "/", label: "Home" },
                ...(parent ? [{ href: `/c/${parent.slug}`, label: parent.name }] : []),
                { label: category.name },
              ]}
            />
            <h1 className="mt-4 font-display font-bold text-4xl tracking-display sm:text-5xl">{category.name}</h1>
            {(category.description ?? parent?.description) && (
              <p className="mt-3 max-w-xl text-base text-ink-muted">{category.description ?? parent?.description}</p>
            )}
          </div>
          {category.image && (
            <div className="relative hidden h-32 w-56 overflow-hidden rounded-xl md:block">
              <Image src={category.image} alt="" fill sizes="224px" className="object-cover" priority />
            </div>
          )}
        </div>
        {siblings.length > 0 && (
          <nav aria-label="Subcategories" className="container-page scrollbar-none -mb-px flex gap-2 overflow-x-auto pb-5">
            <Link
              href={`/c/${top.slug}`}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full border-2 px-4 text-sm transition-colors",
                !parent ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
              )}
              aria-current={!parent ? "page" : undefined}
            >
              All {top.name}
            </Link>
            {siblings.map((ch) => (
              <Link
                key={ch.id}
                href={`/c/${ch.slug}`}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full border-2 px-4 text-sm transition-colors",
                  ch.slug === slug ? "border-line bg-main text-main-foreground shadow-xs" : "border-line-strong hover:border-ink/40",
                )}
                aria-current={ch.slug === slug ? "page" : undefined}
              >
                {ch.name}
              </Link>
            ))}
          </nav>
        )}
      </section>
      <div className="container-page pt-8">
        <BrowseView
          query={{ ...query, category: slug }}
          view={view}
          searchParams={searchParams}
          basePath={`/c/${slug}`}
          showCategory={false}
          lockedKeys={["category"]}
        />
      </div>
    </div>
  );
}
