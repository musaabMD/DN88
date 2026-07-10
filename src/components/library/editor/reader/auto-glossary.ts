import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { getGlossaryTerms, type GlossaryTerm } from "@/lib/library/reader-data";

export const glossaryPluginKey = new PluginKey("drnoteAutoGlossary");

const MAX_DECORATIONS = 80;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type GlossaryOptions = {
  currentPageId: string | null;
  enabled: boolean;
};

function buildMatcher(terms: GlossaryTerm[], currentPageId: string | null) {
  const usable = terms.filter(
    (entry) => entry.pageId !== currentPageId && entry.term.length >= 4
  );
  const byTerm = new Map<string, GlossaryTerm>();
  for (const entry of usable) {
    if (!byTerm.has(entry.term)) byTerm.set(entry.term, entry);
  }
  if (byTerm.size === 0) return null;
  const pattern = [...byTerm.keys()].map(escapeRegExp).join("|");
  return { regex: new RegExp(`\\b(${pattern})\\b`, "gi"), byTerm };
}

function buildDecorations(
  doc: PMNode,
  matcher: ReturnType<typeof buildMatcher>
): DecorationSet {
  if (!matcher) return DecorationSet.empty;
  const decorations: Decoration[] = [];
  const used = new Set<string>();

  doc.descendants((node, pos, parent) => {
    if (decorations.length >= MAX_DECORATIONS) return false;
    if (!node.isText || !node.text) return undefined;
    // Skip headings and already-linked text.
    if (parent && parent.type.name === "heading") return undefined;
    if (node.marks.some((mark) => mark.type.name === "link")) return undefined;

    matcher.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.regex.exec(node.text)) !== null) {
      const termKey = match[0].toLowerCase();
      if (used.has(termKey)) continue;
      const entry = matcher.byTerm.get(termKey);
      if (!entry) continue;
      used.add(termKey);
      const from = pos + match.index;
      const to = from + match[0].length;
      decorations.push(
        Decoration.inline(from, to, {
          class: "auto-glossary",
          "data-page-id": entry.pageId,
          "data-glossary": "true",
        })
      );
      if (decorations.length >= MAX_DECORATIONS) break;
    }
    return undefined;
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Auto-glossary: decorates known topic titles (published article names) with a
 * subtle underline + hover-peek, so any medical term links to its topic without
 * an author manually adding `[[wiki links]]`. Read-only; adds no content.
 */
export const AutoGlossary = Extension.create<GlossaryOptions>({
  name: "autoGlossary",

  addOptions() {
    return {
      currentPageId: null,
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const terms = getGlossaryTerms();
    const currentPageId = this.options.currentPageId;
    const matcher = buildMatcher(terms, currentPageId);
    const initialEnabled = this.options.enabled;

    return [
      new Plugin<{ enabled: boolean; decorations: DecorationSet }>({
        key: glossaryPluginKey,
        state: {
          init: (_config, state) => ({
            enabled: initialEnabled,
            decorations: initialEnabled
              ? buildDecorations(state.doc, matcher)
              : DecorationSet.empty,
          }),
          apply: (tr, value, _oldState, newState) => {
            const meta = tr.getMeta(glossaryPluginKey) as
              | { enabled: boolean }
              | undefined;
            const enabled = meta ? meta.enabled : value.enabled;

            if (!enabled) {
              return { enabled, decorations: DecorationSet.empty };
            }
            if (meta || tr.docChanged) {
              return { enabled, decorations: buildDecorations(newState.doc, matcher) };
            }
            return {
              enabled,
              decorations: value.decorations.map(tr.mapping, tr.doc),
            };
          },
        },
        props: {
          decorations(state) {
            return glossaryPluginKey.getState(state)?.decorations ?? null;
          },
        },
      }),
    ];
  },
});

/** Toggle glossary decorations without recreating the editor. */
export function setGlossaryDecorations(editor: Editor, enabled: boolean): void {
  const { tr } = editor.state;
  tr.setMeta(glossaryPluginKey, { enabled });
  editor.view.dispatch(tr);
}
