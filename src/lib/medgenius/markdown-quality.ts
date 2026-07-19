/** Detect markdown that is really binary PDF/Office bytes shown as text. */
export function isCorruptParsedMarkdown(markdown: string): boolean {
  const sample = markdown.slice(0, 8000);
  if (!sample.trim()) return false;

  if (/^%PDF-\d/.test(sample.trim()) || sample.includes("%PDF-1.")) return true;

  const pdfMarkers = [
    /\b\d+ \d+ obj\b/,
    /endstream/i,
    /endobj/i,
    /FlateDecode/i,
    /\/Type\s*\/XRef/i,
  ];
  const pdfHits = pdfMarkers.filter((re) => re.test(sample)).length;
  if (pdfHits >= 2) return true;

  const replacementChars = (sample.match(/\uFFFD/g) ?? []).length;
  if (replacementChars >= 8) return true;

  const controlChars = (sample.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) ?? []).length;
  if (controlChars / Math.max(sample.length, 1) > 0.02) return true;

  const letters = (sample.match(/[a-zA-Z\u0600-\u06FF0-9\s.,;:!?\-()]/g) ?? []).length;
  if (sample.length > 300 && letters / sample.length < 0.35) return true;

  return false;
}
