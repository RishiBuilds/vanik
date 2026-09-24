export const SWATCHES: Record<string, string> = {
  Chalk: "#efeae2",
  Oat: "#d9ccb4",
  Charcoal: "#3a3836",
  "Speckled Oat": "#ddd2bf",
  "Sea Salt": "#dfe4e1",
  "Tide Blue": "#4b6a88",
  Ash: "#b9b5ae",
  "Raw Clay": "#b27b5a",
  "Matte White": "#f4f2ee",
  Forest: "#2f4a3a",
  Mustard: "#d4a23a",
  Moss: "#6b7a4b",
  Black: "#1f1f1f",
  White: "#ffffff",
  Graphite: "#4a4a4a",
  Bone: "#e8e1d3",
  Teal: "#2e6f73",
  Cream: "#f2ead8",
  Sand: "#d8c6a5",
  Stone: "#a8a295",
  Sage: "#9fae8e",
  Olive: "#6b6b3a",
  Rust: "#a24a26",
  Midnight: "#1f2a44",
  Cherry: "#8e1b24",
  Navy: "#1f2d4d",
  Tan: "#b88a5a",
  Espresso: "#4a3222",
};

export function swatch(value: string) {
  return SWATCHES[value] ?? null;
}
