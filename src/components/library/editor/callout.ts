import { mergeAttributes, Node } from "@tiptap/core";

/**
 * Semantic callout variants. Each encodes one *type* of information so color
 * carries meaning (exam-critical, danger, tip, …) rather than decoration.
 */
export const CALLOUT_VARIANTS = [
  "hy",
  "warning",
  "pearl",
  "mnemonic",
  "definition",
  "note",
] as const;

export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const CALLOUT_LABELS: Record<CalloutVariant, string> = {
  hy: "High-yield",
  warning: "Warning",
  pearl: "Clinical pearl",
  mnemonic: "Mnemonic",
  definition: "Definition",
  note: "Key points",
};

/** Accept a few friendly aliases when authoring `[!type]` admonitions. */
const VARIANT_ALIASES: Record<string, CalloutVariant> = {
  hy: "hy",
  "high-yield": "hy",
  highyield: "hy",
  warning: "warning",
  danger: "warning",
  caution: "warning",
  redflag: "warning",
  "red-flag": "warning",
  pearl: "pearl",
  tip: "pearl",
  clinical: "pearl",
  mnemonic: "mnemonic",
  memory: "mnemonic",
  definition: "definition",
  define: "definition",
  def: "definition",
  note: "note",
  key: "note",
  keypoints: "note",
  summary: "note",
};

export function normalizeCalloutVariant(raw: string | null | undefined): CalloutVariant {
  if (!raw) return "note";
  const key = raw.trim().toLowerCase();
  return VARIANT_ALIASES[key] ?? "note";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: CalloutVariant) => ReturnType;
      toggleCallout: (variant?: CalloutVariant) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

/**
 * Block container that groups content into a labeled, color-coded box.
 * Renders plainly (a subtle bordered block) by default; the reader's
 * "colorful view" toggle adds the tinted background + accent per variant.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "note" as CalloutVariant,
        parseHTML: (element) =>
          normalizeCalloutVariant(element.getAttribute("data-callout")),
        renderHTML: (attributes) => ({
          "data-callout": (attributes.variant as string) ?? "note",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const variant = normalizeCalloutVariant(node.attrs.variant as string);
    const label = CALLOUT_LABELS[variant];
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "article-callout" }),
      [
        "div",
        { class: "article-callout-label", contenteditable: "false" },
        ["span", { class: "article-callout-dot" }],
        ["span", { class: "article-callout-label-text" }, label],
      ],
      ["div", { class: "article-callout-body" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (variant = "note") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      toggleCallout:
        (variant = "note") =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
