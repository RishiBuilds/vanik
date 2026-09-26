export const SORTS = {
  relevance: "Most relevant",
  bestselling: "Best selling",
  newest: "Newest",
  rating: "Top rated",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  discount: "Biggest discount",
} as const;
export type SortKey = keyof typeof SORTS;
