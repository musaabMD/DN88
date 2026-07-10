"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  FileText,
  Italic,
  Underline,
} from "lucide-react";
import type { PageSearchItem } from "@/lib/pages";
import { buildInternalLinkAttrs } from "@/lib/pages";
import { getHighlightColors } from "@/components/library/editor/highlight-colors";
import { WikiLinkPicker } from "@/components/library/editor/wiki-link/wiki-link-picker";
import { setInternalLinkOnSelection } from "@/components/library/editor/wiki-link/wiki-link-commands";
import { readThemeFromDom } from "@/lib/theme";

function BubbleBtn({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tiptap-bubble-btn ${active ? "is-active" : ""}`}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Formatting controls shown only when text is selected. */
export function SelectionBubbleMenu({ editor }: { editor: Editor }) {
  const [wikiPickerOpen, setWikiPickerOpen] = useState(false);
  const [theme, setTheme] = useState(readThemeFromDom);

  useEffect(() => {
    setTheme(readThemeFromDom());
    const observer = new MutationObserver(() => setTheme(readThemeFromDom()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const highlightColors = getHighlightColors(theme);

  const linkToPage = (item: PageSearchItem) => {
    const attrs = item.exists
      ? buildInternalLinkAttrs({ pageId: item.id, pageTitle: item.title, exists: true })
      : buildInternalLinkAttrs({
          pageId: item.pendingId,
          pageTitle: item.title,
          exists: false,
        });
    setInternalLinkOnSelection(editor, attrs);
  };

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="tiptap-bubble-menu"
        shouldShow={({ state }) => !state.selection.empty}
      >
        <BubbleBtn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} strokeWidth={2.5} />
        </BubbleBtn>
        <BubbleBtn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} strokeWidth={2.5} />
        </BubbleBtn>
        <BubbleBtn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={15} strokeWidth={2.5} />
        </BubbleBtn>

        <span className="tiptap-bubble-divider" aria-hidden />

        {highlightColors.slice(0, 4).map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.label}
            className="tiptap-bubble-swatch"
            style={{ backgroundColor: color.value }}
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: color.value }).run()
            }
          />
        ))}

        <span className="tiptap-bubble-divider" aria-hidden />

        <BubbleBtn title="Link to page" onClick={() => setWikiPickerOpen(true)}>
          <FileText size={15} strokeWidth={2} />
        </BubbleBtn>
        <button
          type="button"
          className="tiptap-bubble-copy"
          onClick={async () => {
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, "\n");
            await navigator.clipboard.writeText(text);
          }}
        >
          Copy
        </button>
      </BubbleMenu>

      <WikiLinkPicker
        open={wikiPickerOpen}
        initialQuery={editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          " "
        )}
        onClose={() => setWikiPickerOpen(false)}
        onSelect={(item) => {
          linkToPage(item);
          setWikiPickerOpen(false);
        }}
      />
    </>
  );
}
