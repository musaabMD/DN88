export type StoredPageImage = {
  r2Key: string;
  page: number;
  position: number;
  alt: string;
  mimeType: string;
  /** Public API path segment (filename only). */
  filename: string;
};

const IMAGE_MARKDOWN_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("svg")) return "svg";
  return "bin";
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match?.[1] || !match[2]) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, mimeType: match[1] };
  } catch {
    return null;
  }
}

/** Split stored markdown into page slices (form-feed delimiters from page-by-page parse). */
export function splitMarkdownByPages(markdown: string, targetPageCount?: number): string[] {
  const text = markdown.trim();
  if (!text) return [""];
  if (text.includes("\f")) {
    const pages = text.split("\f").map((page) => page.trim()).filter(Boolean);
    if (pages.length > 0) {
      if (targetPageCount && targetPageCount > pages.length) {
        return chunkMarkdownEvenly(text.replace(/\f/g, "\n\n"), targetPageCount);
      }
      return pages;
    }
  }
  const explicit = text.match(/<!--\s*pages:\s*(\d+)\s*-->/i);
  if (explicit?.[1]) {
    const target = parseInt(explicit[1], 10);
    if (target > 1) {
      const sections = text.split(/\n(?=##?\s+)/).filter((section) => section.trim());
      if (sections.length >= target) return sections.slice(0, target);
    }
  }

  const sections = text.split(/\n(?=##?\s+)/).filter((section) => section.trim());
  if (sections.length > 1) {
    if (targetPageCount && targetPageCount > 0 && sections.length !== targetPageCount) {
      return chunkSections(sections, targetPageCount);
    }
    return sections;
  }

  if (targetPageCount && targetPageCount > 1) {
    return chunkMarkdownEvenly(text, targetPageCount);
  }

  return [text];
}

const PAGE_CHARS = 2800;

function chunkSections(sections: string[], targetCount: number): string[] {
  if (sections.length <= targetCount) {
    const padded = [...sections];
    while (padded.length < targetCount) {
      padded.push("");
    }
    return padded;
  }

  const pages: string[] = [];
  const perPage = Math.ceil(sections.length / targetCount);
  for (let index = 0; index < sections.length; index += perPage) {
    pages.push(sections.slice(index, index + perPage).join("\n\n"));
  }
  return pages.slice(0, targetCount);
}

function chunkMarkdownEvenly(text: string, targetCount: number): string[] {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length === 0) return [text];

  const pages: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (current && pages.length < targetCount - 1 && next.length > PAGE_CHARS) {
      pages.push(current);
      current = paragraph;
      continue;
    }
    current = next;
  }

  if (current) pages.push(current);
  if (pages.length === 0) return [text];

  while (pages.length < targetCount) {
    pages.push("");
  }

  return pages.slice(0, targetCount);
}

/**
 * Extract base64 / remote images from markdown, upload to R2, rewrite refs to asset filenames.
 */
export async function persistMarkdownImages(
  bucket: R2Bucket,
  imagePrefix: string,
  pageNumber: number,
  markdown: string
): Promise<{ markdown: string; images: StoredPageImage[] }> {
  const stored: StoredPageImage[] = [];
  let position = 0;

  const rewritten = await replaceAsync(markdown, IMAGE_MARKDOWN_RE, async (full, alt, src) => {
    const trimmedSrc = src.trim();
    if (!trimmedSrc.startsWith("data:")) {
      return full;
    }

    const decoded = decodeDataUrl(trimmedSrc);
    if (!decoded) return full;

    const ext = extensionForMime(decoded.mimeType);
    const filename = `page-${pageNumber}-${position}.${ext}`;
    const r2Key = `${imagePrefix}/${filename}`;

    await bucket.put(r2Key, decoded.bytes, {
      httpMetadata: { contentType: decoded.mimeType },
    });

    stored.push({
      r2Key,
      page: pageNumber,
      position,
      alt: alt.trim(),
      mimeType: decoded.mimeType,
      filename,
    });
    position += 1;

    return `![${alt}](asset://${filename})`;
  });

  return { markdown: rewritten, images: stored };
}

async function replaceAsync(
  input: string,
  regex: RegExp,
  replacer: (match: string, ...groups: string[]) => Promise<string>
): Promise<string> {
  const global = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = global.exec(input)) !== null) {
    result += input.slice(lastIndex, match.index);
    result += await replacer(match[0], ...(match.slice(1) as string[]));
    lastIndex = global.lastIndex;
  }

  result += input.slice(lastIndex);
  return result;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Load stored page images as data URLs for OpenRouter vision input. */
export async function loadImageDataUrls(
  bucket: R2Bucket,
  images: StoredPageImage[]
): Promise<string[]> {
  const urls: string[] = [];

  for (const image of images) {
    const obj = await bucket.get(image.r2Key);
    if (!obj) continue;
    const bytes = new Uint8Array(await obj.arrayBuffer());
    if (bytes.length === 0) continue;
    urls.push(`data:${image.mimeType};base64,${bytesToBase64(bytes)}`);
  }

  return urls;
}

export async function storeImageBytes(
  bucket: R2Bucket,
  r2Key: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<void> {
  await bucket.put(r2Key, bytes, {
    httpMetadata: { contentType: mimeType },
  });
}
