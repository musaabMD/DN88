import type { Editor } from "@tiptap/core";
import type { Mark } from "@tiptap/pm/model";
import {
  buildInternalLinkFromTitle,
  refreshInternalLinkAttrs,
} from "@/lib/pages";
import type { InternalLinkAttrs } from "@/lib/pages/types";
import { WIKI_LINK_META } from "@/components/library/editor/wiki-link/constants";

export function toLinkMarkAttrs(attrs: InternalLinkAttrs): Record<string, unknown> {
  return {
    href: attrs.href,
    pageId: attrs.pageId,
    pageTitle: attrs.pageTitle,
    exists: attrs.exists,
    linkType: attrs.linkType,
  };
}

export function insertInternalLink(
  editor: Editor,
  range: { from: number; to: number },
  attrs: InternalLinkAttrs
): boolean {
  const { from, to } = range;
  const title = attrs.pageTitle;

  return editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const linkType = state.schema.marks.link;
      if (!linkType) return false;

      tr.insertText(title, from, to);
      const mark = linkType.create(toLinkMarkAttrs(attrs));
      tr.addMark(from, from + title.length, mark);
      tr.setMeta(WIKI_LINK_META, true);
      return true;
    })
    .run();
}

export function setInternalLinkOnSelection(
  editor: Editor,
  attrs: InternalLinkAttrs
): boolean {
  const linkType = editor.schema.marks.link;
  if (!linkType) return false;

  return editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const { from, to, empty } = state.selection;
      if (empty) return false;

      const mark = linkType.create(toLinkMarkAttrs(attrs));
      tr.addMark(from, to, mark);
      tr.setMeta(WIKI_LINK_META, true);
      return true;
    })
    .run();
}

export function internalLinkFromTitle(title: string): InternalLinkAttrs {
  return buildInternalLinkFromTitle(title);
}

/** Walk the document and refresh internal link attrs from the page index. */
export function syncWikiLinksInEditor(editor: Editor): boolean {
  const linkMark = editor.schema.marks.link;
  if (!linkMark) return false;

  let changed = false;
  const { tr } = editor.state;
  tr.setMeta(WIKI_LINK_META, true);

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;

    const link = node.marks.find((mark: Mark) => mark.type.name === "link");
    if (!link || link.attrs.linkType !== "internal") return;

    const pageId = link.attrs.pageId as string | null;
    const pageTitle = link.attrs.pageTitle as string | null;
    if (!pageId || !pageTitle) return;

    const refreshed = refreshInternalLinkAttrs({ pageId, pageTitle });
    const same =
      link.attrs.href === refreshed.href &&
      link.attrs.pageId === refreshed.pageId &&
      link.attrs.exists === refreshed.exists &&
      link.attrs.pageTitle === refreshed.pageTitle;

    if (!same) {
      tr.removeMark(pos, pos + node.nodeSize, linkMark);
      tr.addMark(
        pos,
        pos + node.nodeSize,
        linkMark.create(toLinkMarkAttrs(refreshed))
      );
      changed = true;
    }
  });

  if (changed) {
    editor.view.dispatch(tr);
  }

  return changed;
}

export function applyWikiLinkInputRule(
  editor: Editor,
  range: { from: number; to: number },
  title: string
): boolean {
  const attrs = internalLinkFromTitle(title);
  return insertInternalLink(editor, range, attrs);
}
