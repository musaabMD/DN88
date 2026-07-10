/** Transaction meta key — DecorationOnly allows wiki-link edits. */
export const WIKI_LINK_META = "wikiLink";

/** Plugin key for the wiki-link suggestion popup. */
export const wikiLinkPluginKey = "wikiLinkSuggestion";

/** Regex for `[[Page Name]]` at end of input (input rule). */
export const WIKI_LINK_INPUT_REGEX = /\[\[([^\]]+)\]\]$/;

/** Regex for an unfinished `[[query` before the cursor (suggestion). */
export const WIKI_LINK_OPEN_REGEX = /\[\[([^\]]*)$/;

/** Regex to split plain text into wiki-link segments on import. */
export const WIKI_LINK_SPLIT_REGEX = /\[\[([^\]]+)\]\]/g;

export function isWikiLinkMark(attrs: Record<string, unknown>): boolean {
  return attrs.linkType === "internal";
}
