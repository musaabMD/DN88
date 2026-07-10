import type { EditorState } from "@tiptap/pm/state";
import { WIKI_LINK_OPEN_REGEX } from "@/components/library/editor/wiki-link/constants";

/** True when the cursor is inside an unfinished `[[...` wiki-link token. */
export function isInsideWikiLinkBrackets(state: EditorState, pos?: number): boolean {
  const $pos = state.selection.$from;
  const cursor = pos ?? $pos.pos;
  const start = Math.max(0, cursor - 256);
  const before = state.doc.textBetween(start, cursor, "\n", "\n");
  return WIKI_LINK_OPEN_REGEX.test(before);
}

/** Allow typing while composing a `[[Page Name]]` token. */
export function isWikiLinkTextInputAllowed(
  state: EditorState,
  from: number,
  text: string
): boolean {
  const $pos = state.doc.resolve(from);
  const start = Math.max(0, $pos.parentOffset - 256);
  const before = $pos.parent.textBetween(start, $pos.parentOffset, undefined, "\ufffc");
  const combined = before + text;

  if (text === "[" && before.endsWith("[")) return true;
  if (/\[\[[^\]]*$/.test(combined)) return true;
  if (text === "]" && /\[\[[^\]]*\]$/.test(before)) return true;

  return isInsideWikiLinkBrackets(state, from);
}

/** Allow backspace/delete while editing wiki brackets. */
export function isWikiLinkEditingContext(state: EditorState): boolean {
  const { from, to, empty } = state.selection;
  if (!empty) {
    const selected = state.doc.textBetween(from, to, "\n", "\n");
    if (selected.includes("[[") || selected.includes("]]")) return true;
  }
  return isInsideWikiLinkBrackets(state, from);
}
