export type LibraryEditorMode = "agent" | "docx" | "notion" | "simple";

export const LIBRARY_EDITOR_MODES: Array<{
  id: LibraryEditorMode;
  label: string;
  description: string;
}> = [
  {
    id: "agent",
    label: "Agent editor",
    description: "Style text with AI assistance",
  },
  {
    id: "docx",
    label: "Docx editor",
    description: "Word-style formatting toolbar",
  },
  {
    id: "notion",
    label: "Notion-like editor",
    description: "Block-based reading layout",
  },
  {
    id: "simple",
    label: "Simple editor",
    description: "Minimal highlight and color tools",
  },
];
