export type EditorBgTheme = "white" | "sepia" | "gray" | "dark";

export const EDITOR_BG_THEMES: {
  id: EditorBgTheme;
  label: string;
  page: string;
  prose: string;
}[] = [
  {
    id: "white",
    label: "White",
    page: "rgb(255 255 255)",
    prose: "rgb(15 23 42)",
  },
  {
    id: "sepia",
    label: "Sepia",
    page: "rgb(250 245 235)",
    prose: "rgb(68 64 60)",
  },
  {
    id: "gray",
    label: "Gray",
    page: "rgb(248 250 252)",
    prose: "rgb(30 41 59)",
  },
  {
    id: "dark",
    label: "Dark",
    page: "rgb(15 23 42)",
    prose: "rgb(226 232 240)",
  },
];

export function getEditorBgTheme(id: EditorBgTheme) {
  return EDITOR_BG_THEMES.find((t) => t.id === id) ?? EDITOR_BG_THEMES[0]!;
}
