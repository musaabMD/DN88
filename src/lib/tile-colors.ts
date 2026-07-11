/** Unified slate accent for all library thumbnails. */
const TILE_COLOR = { bg: "#334155", border: "#1e293b" } as const;

export function getTileColors(seed?: string): { bg: string; border: string } {
  void seed;
  return TILE_COLOR;
}
