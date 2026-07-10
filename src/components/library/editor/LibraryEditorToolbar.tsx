"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Bot,
  ChevronDown,
  Code,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Strikethrough,
  Underline,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";
import type { LibraryEditorMode } from "@/components/library/editor/types";
import {
  FONT_SIZE_OPTIONS,
  type FontSizeOption,
} from "@/components/library/editor/font-size";

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bae6fd" },
  { label: "Pink", value: "#fbcfe8" },
];

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Slate", value: "#334155" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
];

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "ui-monospace, monospace" },
  { label: "Sans", value: "Inter, system-ui, sans-serif" },
];

function ToolbarButton({
  active,
  onClick,
  children,
  title,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-sm transition-colors disabled:opacity-40 ${
        active
          ? "bg-slate-200 text-slate-900"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-6 w-px bg-slate-200" aria-hidden />;
}

function ToolbarSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 ${className ?? ""}`}
    >
      {options.map((opt) => (
        <option key={opt.label} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function LibraryEditorToolbar({
  editor,
  mode,
  compact = false,
  zoom = 100,
}: {
  editor: Editor;
  mode: LibraryEditorMode;
  compact?: boolean;
  zoom?: number;
}) {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      editor.view.focus();
    },
    [editor]
  );

  const isSimple = mode === "simple";
  const isDocx = mode === "docx";
  const isAgent = mode === "agent";
  const isNotion = mode === "notion";

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "p";

  return (
    <div
      className={`library-editor-toolbar sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur ${
        isNotion ? "border-dashed" : ""
      }`}
    >
      {(isDocx || isAgent) && !compact ? (
        <>
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-50 px-1">
            <ToolbarButton title="Zoom out" onClick={() => {}} disabled>
              <ZoomOut size={14} />
            </ToolbarButton>
            <span className="min-w-10 text-center text-xs font-bold text-slate-500">
              {zoom}%
            </span>
            <ToolbarButton title="Zoom in" onClick={() => {}} disabled>
              <ZoomIn size={14} />
            </ToolbarButton>
          </div>
          <ToolbarDivider />
        </>
      ) : null}

      {isAgent ? (
        <>
          <span className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
            <Bot size={14} />
            Style only
          </span>
          <ToolbarDivider />
        </>
      ) : null}

      {(isDocx || isNotion || isAgent) && !isSimple ? (
        <>
          <ToolbarSelect
            value={currentHeading}
            onChange={(val) =>
              run(() => {
                if (val === "p") editor.chain().focus().setParagraph().run();
                else
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({
                      level: Number(val) as 1 | 2 | 3,
                    })
                    .run();
              })
            }
            options={[
              { label: "Paragraph", value: "p" },
              { label: "Heading 1", value: "1" },
              { label: "Heading 2", value: "2" },
              { label: "Heading 3", value: "3" },
            ]}
            className="max-w-[7rem]"
          />
          <ToolbarDivider />
        </>
      ) : null}

      {(isDocx || isNotion || isAgent) && !isSimple ? (
        <>
          <ToolbarSelect
            value={
              (editor.getAttributes("textStyle").fontFamily as string) ?? ""
            }
            onChange={(val) =>
              run(() => {
                if (val) editor.chain().focus().setFontFamily(val).run();
                else editor.chain().focus().unsetFontFamily().run();
              })
            }
            options={FONT_FAMILIES}
            className="max-w-[6.5rem]"
          />
          <ToolbarSelect
            value={
              ((editor.getAttributes("textStyle").fontSize as string) ??
                "16px").replace("px", "") || "16"
            }
            onChange={(val) =>
              run(() => {
                if (val)
                  editor.chain().focus().setFontSize(`${val}px`).run();
                else editor.chain().focus().unsetFontSize().run();
              })
            }
            options={FONT_SIZE_OPTIONS.map((s) => ({
              label: s,
              value: s,
            }))}
            className="w-14"
          />
          <ToolbarDivider />
        </>
      ) : null}

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold size={15} strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic size={15} strokeWidth={2.5} />
      </ToolbarButton>

      {(isDocx || isAgent || isNotion) && !isSimple ? (
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <Strikethrough size={15} strokeWidth={2.5} />
        </ToolbarButton>
      ) : null}

      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() =>
          run(() => editor.chain().focus().toggleUnderline().run())
        }
      >
        <Underline size={15} strokeWidth={2.5} />
      </ToolbarButton>

      {(isDocx || isNotion) && !isSimple ? (
        <ToolbarButton
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => run(() => editor.chain().focus().toggleCode().run())}
        >
          <Code size={15} strokeWidth={2.5} />
        </ToolbarButton>
      ) : null}

      <ToolbarDivider />

      <div className="relative">
        <ToolbarButton
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => setShowHighlightMenu((v) => !v)}
        >
          <Highlighter size={15} strokeWidth={2.5} />
          <ChevronDown size={12} className="ml-0.5 opacity-60" />
        </ToolbarButton>
        {showHighlightMenu ? (
          <div className="absolute left-0 top-full z-30 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                aria-label={color.label}
                className="h-6 w-6 rounded-md ring-1 ring-slate-200"
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  run(() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHighlight({ color: color.value })
                      .run()
                  );
                  setShowHighlightMenu(false);
                }}
              />
            ))}
            <button
              type="button"
              title="Remove highlight"
              className="rounded-md px-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
              onClick={() => {
                run(() => editor.chain().focus().unsetHighlight().run());
                setShowHighlightMenu(false);
              }}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <ToolbarButton
          title="Text color"
          onClick={() => setShowColorMenu((v) => !v)}
        >
          <Palette size={15} strokeWidth={2.5} />
          <ChevronDown size={12} className="ml-0.5 opacity-60" />
        </ToolbarButton>
        {showColorMenu ? (
          <div className="absolute left-0 top-full z-30 mt-1 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.label}
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  run(() => {
                    if (color.value)
                      editor.chain().focus().setColor(color.value).run();
                    else editor.chain().focus().unsetColor().run();
                  });
                  setShowColorMenu(false);
                }}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-slate-200"
                  style={{
                    backgroundColor: color.value || "#334155",
                  }}
                />
                {color.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {(isDocx || isNotion) && !isSimple ? (
        <>
          <ToolbarDivider />
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() =>
              run(() => editor.chain().focus().toggleBulletList().run())
            }
          >
            <List size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() =>
              run(() => editor.chain().focus().toggleOrderedList().run())
            }
          >
            <ListOrdered size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() =>
              run(() => editor.chain().focus().setTextAlign("left").run())
            }
          >
            <AlignLeft size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() =>
              run(() => editor.chain().focus().setTextAlign("center").run())
            }
          >
            <AlignCenter size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() =>
              run(() => editor.chain().focus().setTextAlign("right").run())
            }
          >
            <AlignRight size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton
            title="Justify"
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() =>
              run(() => editor.chain().focus().setTextAlign("justify").run())
            }
          >
            <AlignJustify size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton
            title="Horizontal rule"
            onClick={() =>
              run(() => editor.chain().focus().setHorizontalRule().run())
            }
          >
            <Minus size={15} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton
            title="Link"
            active={editor.isActive("link")}
            onClick={() => {
              const previous = editor.getAttributes("link").href as
                | string
                | undefined;
              const url = window.prompt("Link URL (style only)", previous ?? "");
              if (url === null) return;
              run(() => {
                if (url === "")
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                else
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url })
                    .run();
              });
            }}
          >
            <Link2 size={15} strokeWidth={2.5} />
          </ToolbarButton>
        </>
      ) : null}
    </div>
  );
}

export type { FontSizeOption };
