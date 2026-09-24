import type { Metadata } from "next";
import { parseBrowseParams } from "@/lib/browse-params";
import { BrowseView } from "@/components/browse/browse-view";
import { Breadcrumbs } from "@/components/shop/section";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseBrowseParams(await props.searchParams);
  return { title: q ? `“${q}”` : "Shop all" };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const { view, ...query } = parseBrowseParams(searchParams);

  const title = query.q
    ? `Results for “${query.q}”`
    : query.onSale
      ? "On sale"
      : query.sort === "newest"
        ? "New arrivals"
        : query.sort === "bestselling"
          ? "Bestsellers"
          : "Shop all";

  return (
    <div className="container-page pb-8 pt-8 lg:pt-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: query.q ? "Search" : title }]} />
      <h1 className="mb-8 mt-4 font-display font-bold text-4xl tracking-display sm:text-5xl">{title}</h1>
      <BrowseView query={query} view={view} searchParams={searchParams} basePath="/search" />
    </div>
  );
}
