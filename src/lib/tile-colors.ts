/** Deterministic accent colors for set thumbnails (first-letter tiles). */
const TILE_PALETTES = [
  { bg: "#6366f1", border: "#4f46e5" },
  { bg: "#1CB0F6", border: "#1899D6" },
  { bg: "#FF9600", border: "#E08600" },
  { bg: "#CE82FF", border: "#B86EEB" },
  { bg: "#FF4B4B", border: "#E04343" },
  { bg: "#FFC800", border: "#E0B000" },
  { bg: "#2DD4BF", border: "#14B8A6" },
  { bg: "#F472B6", border: "#DB2777" },
] as const;

export function getTileColors(seed: string): { bg: string; border: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TILE_PALETTES[Math.abs(hash) % TILE_PALETTES.length]!;
}
