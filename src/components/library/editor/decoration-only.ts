import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { AddMarkStep, RemoveMarkStep } from "@tiptap/pm/transform";

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
      Backspace: () => true,
      Delete: () => true,
      Enter: () => true,
      "Mod-Backspace": () => true,
      "Mod-Delete": () => true,
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
        handleTextInput: () => true,
        handlePaste: () => true,
        handleDrop: () => true,
      },
    });
  },
});
