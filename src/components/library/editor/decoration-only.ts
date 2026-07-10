import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { AddMarkStep, RemoveMarkStep } from "@tiptap/pm/transform";
import { WIKI_LINK_META } from "@/components/library/editor/wiki-link/constants";
import {
  isWikiLinkEditingContext,
  isWikiLinkTextInputAllowed,
} from "@/components/library/editor/wiki-link/wiki-link-editing";

function isStyleOnlyStep(step: unknown): boolean {
  if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
    return true;
  }

  const name = step?.constructor?.name ?? "";
  return name === "SetNodeMarkupStep" || name === "AddNodeMarkStep";
}

/**
 * Blocks content changes (typing, deleting, pasting) while allowing mark toggles,
 * node styling, and structural layout features (details, images) that do not
 * alter document text.
 */
export const DecorationOnly = Extension.create({
  name: "decorationOnly",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (transaction, state) => {
          if (!transaction.docChanged) return true;
          if (transaction.getMeta(WIKI_LINK_META)) return true;
          if (transaction.steps.every(isStyleOnlyStep)) return true;

          const beforeText = state.doc.textContent;
          const afterText = transaction.doc.textContent;
          return beforeText === afterText;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => (isWikiLinkEditingContext(editor.state) ? false : true),
      Delete: ({ editor }) => (isWikiLinkEditingContext(editor.state) ? false : true),
      Enter: () => true,
      "Mod-Backspace": ({ editor }) =>
        isWikiLinkEditingContext(editor.state) ? false : true,
      "Mod-Delete": ({ editor }) =>
        isWikiLinkEditingContext(editor.state) ? false : true,
      "Mod-x": () => true,
      "Mod-v": () => true,
      "Mod-z": () => true,
      "Mod-y": () => true,
      "Mod-Shift-z": () => true,
    };
  },

  addOptions() {
    return {
      onBlockedInput: undefined as (() => void) | undefined,
    };
  },

  onCreate() {
    this.editor.setOptions({
      editorProps: {
        handleTextInput: (view, from, to, text) => {
          if (isWikiLinkTextInputAllowed(view.state, from, text)) return false;
          return true;
        },
        handlePaste: () => true,
        handleDrop: () => true,
      },
    });
  },
});
