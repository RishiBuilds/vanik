import type { BrowseParams } from "@/lib/queries/catalog";
import { SORTS, type SortKey } from "@/lib/sorts";
import { firstParam, type SearchParams } from "@/lib/utils";

const list = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]).filter(Boolean);
const num = (v: string | string[] | undefined) => {
  const n = Number(firstParam(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parseBrowseParams(sp: SearchParams): BrowseParams & { view: "grid" | "list" } {
  const sort = firstParam(sp.sort) as SortKey | undefined;
  const min = num(sp.min);
  const max = num(sp.max);
  return {
    q: firstParam(sp.q)?.slice(0, 100),
    category: firstParam(sp.category),
    stores: list(sp.store),
    colors: list(sp.color),
    sizes: list(sp.size),
    minPrice: min != null ? Math.round(min * 100) : undefined,
    maxPrice: max != null ? Math.round(max * 100) : undefined,
    rating: num(sp.rating),
    inStock: firstParam(sp.stock) === "1",
    onSale: firstParam(sp.sale) === "1",
    sort: sort && sort in SORTS ? sort : undefined,
    page: num(sp.page),
    view: firstParam(sp.view) === "list" ? "list" : "grid",
  };
}
