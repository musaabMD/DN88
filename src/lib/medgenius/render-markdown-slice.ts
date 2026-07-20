function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function formatBlock(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  if (/^[-*•]\s+/.test(trimmed)) {
    return `<ul><li>${formatInlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""))}</li></ul>`;
  }

  if (/^>\s+/.test(trimmed)) {
    return `<div class="ss-md-callout" style="border-left:4px solid #58CC02;background:#EAFBD9;color:#3C3C3C;border-radius:0.75rem;padding:0.75rem 1rem;margin:0 0 1rem;font-size:0.875rem;font-weight:700"><p>${formatInlineMarkdown(trimmed.replace(/^>\s+/, ""))}</p></div>`;
  }

  if (/^#{1,3}\s+/.test(trimmed)) {
    const level = trimmed.match(/^#+/)?.[0].length ?? 2;
    const tag = level <= 2 ? "h2" : "h3";
    return `<${tag}>${formatInlineMarkdown(trimmed.replace(/^#+\s+/, ""))}</${tag}>`;
  }

  return `<p>${formatInlineMarkdown(trimmed)}</p>`;
}

/** Render one page slice of Context.dev markdown as selectable HTML. */
export function renderMarkdownSlice(markdown: string): string {
  const lines = markdown.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return "<p></p>";

  const parts: string[] = [];
  for (const line of lines) {
    const block = formatBlock(line);
    if (block) parts.push(block);
  }
  return parts.join("");
}
