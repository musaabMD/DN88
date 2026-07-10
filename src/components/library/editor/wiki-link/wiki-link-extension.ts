import { Extension, InputRule } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import type { PageSearchItem } from "@/lib/pages";
import {
  buildInternalLinkAttrs,
  buildInternalLinkFromTitle,
  searchPages,
} from "@/lib/pages";
import {
  WIKI_LINK_INPUT_REGEX,
  WIKI_LINK_META,
  WIKI_LINK_OPEN_REGEX,
  wikiLinkPluginKey,
} from "@/components/library/editor/wiki-link/constants";
import { InternalLink } from "@/components/library/editor/wiki-link/internal-link-extension";
import {
  insertInternalLink,
  setInternalLinkOnSelection,
  syncWikiLinksInEditor,
  toLinkMarkAttrs,
} from "@/components/library/editor/wiki-link/wiki-link-commands";
import {
  WikiLinkAutocomplete,
  type WikiLinkAutocompleteRef,
} from "@/components/library/editor/wiki-link/wiki-link-autocomplete";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wikiLink: {
      setInternalLink: (attrs: {
        pageId: string;
        pageTitle: string;
        exists?: boolean;
      }) => ReturnType;
      linkSelectionToPage: (item: PageSearchItem) => ReturnType;
      syncWikiLinks: () => ReturnType;
    };
  }
}

function wikiLinkFromSearchItem(item: PageSearchItem) {
  if (item.exists) {
    return buildInternalLinkAttrs({
      pageId: item.id,
      pageTitle: item.title,
      exists: true,
    });
  }
  return buildInternalLinkAttrs({
    pageId: item.pendingId,
    pageTitle: item.title,
    exists: false,
  });
}

function findWikiSuggestionMatch(config: {
  char: string;
  $position: import("@tiptap/pm/model").ResolvedPos;
}) {
  const { $position } = config;
  const text = $position.parent.textBetween(
    0,
    $position.parentOffset,
    undefined,
    "\ufffc"
  );
  const match = text.match(WIKI_LINK_OPEN_REGEX);
  if (!match) return null;

  const full = match[0];
  const query = match[1] ?? "";
  const from = $position.pos - full.length;
  const to = $position.pos;

  return { range: { from, to }, query, text: full };
}

export const WikiLink = Extension.create({
  name: "wikiLink",

  addExtensions() {
    return [
      InternalLink.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
    ];
  },

  addCommands() {
    return {
      setInternalLink:
        (attrs) =>
        ({ editor, chain }) => {
          const linkAttrs = buildInternalLinkAttrs(attrs);
          const { from, to, empty } = editor.state.selection;
          if (empty) return false;
          return (
            chain()
              .command(({ tr, state }) => {
                const linkType = state.schema.marks.link;
                if (!linkType) return false;
                tr.addMark(from, to, linkType.create(toLinkMarkAttrs(linkAttrs)));
                tr.setMeta(WIKI_LINK_META, true);
                return true;
              })
              .run()
          );
        },

      linkSelectionToPage:
        (item) =>
        ({ editor }) => {
          const attrs = wikiLinkFromSearchItem(item);
          return setInternalLinkOnSelection(editor, attrs);
        },

      syncWikiLinks:
        () =>
        ({ editor }) => {
          syncWikiLinksInEditor(editor);
          return true;
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: WIKI_LINK_INPUT_REGEX,
        handler: ({ range, match, chain }) => {
          const title = match[1]?.trim();
          if (!title) return null;
          const attrs = buildInternalLinkFromTitle(title);
          chain()
            .command(({ tr, state }) => {
              const linkType = state.schema.marks.link;
              if (!linkType) return false;
              tr.replaceWith(
                range.from,
                range.to,
                state.schema.text(attrs.pageTitle, [
                  linkType.create(toLinkMarkAttrs(attrs)),
                ])
              );
              tr.setMeta(WIKI_LINK_META, true);
              return true;
            })
            .run();
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      Suggestion<PageSearchItem, PageSearchItem>({
        pluginKey: new PluginKey(wikiLinkPluginKey),
        editor,
        char: "[",
        allowSpaces: true,
        allowedPrefixes: [" ", "\n", "\u0000"],
        findSuggestionMatch: findWikiSuggestionMatch,
        allow: ({ state, range }) => {
          const text = state.doc.textBetween(range.from, range.to, "");
          return text.startsWith("[[");
        },
        items: ({ query }) => searchPages(query),
        command: ({ editor: ed, range, props }) => {
          const attrs = wikiLinkFromSearchItem(props);
          insertInternalLink(ed, range, attrs);
        },
        render: () => {
          let component: ReactRenderer<WikiLinkAutocompleteRef> | null = null;
          let unmount: (() => void) | null = null;

          return {
            onStart: (props: SuggestionProps<PageSearchItem, PageSearchItem>) => {
              component = new ReactRenderer(WikiLinkAutocomplete, {
                editor: props.editor,
                props: {
                  items: props.items,
                  query: props.query,
                  command: (item: PageSearchItem) => props.command(item),
                },
              });

              if (!props.clientRect || !component.element) return;

              unmount =
                props.mount?.(component.element as HTMLElement, {
                  onPosition: ({ x, y }) => {
                    const el = component?.element as HTMLElement | undefined;
                    if (!el) return;
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                  },
                }) ?? null;
            },

            onUpdate: (props: SuggestionProps<PageSearchItem, PageSearchItem>) => {
              component?.updateProps({
                items: props.items,
                query: props.query,
                command: (item: PageSearchItem) => props.command(item),
              });
            },

            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                unmount?.();
                component?.destroy();
                return true;
              }
              return component?.ref?.onKeyDown(props.event) ?? false;
            },

            onExit: () => {
              unmount?.();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },

  onCreate() {
    syncWikiLinksInEditor(this.editor);
  },
});

export { syncWikiLinksInEditor };
