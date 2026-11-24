// Evidence checks for the scorecard: every quote the evaluator cites must be
// traceable to a real line of the transcript.

export type TranscriptLine = { id: string; content: string };

export function normalizeForMatch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201B`´]/g, "'")
    .replace(/[\u201C\u201D\u201E«»]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\p{L}\p{N}'\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find the transcript line a quote comes from. Quotes may be shortened with an
 * ellipsis; every fragment must then appear, in order, in the same line.
 * Returns null when the quote cannot be found (the model paraphrased or invented it).
 */
export function findQuote(quote: string, lines: TranscriptLine[]): TranscriptLine | null {
  const fragments = quote
    .split(/\.{3}|…/)
    .map(normalizeForMatch)
    .filter((f) => f.length > 0);
  if (fragments.length === 0) return null;
  for (const line of lines) {
    const haystack = normalizeForMatch(line.content);
    let from = 0;
    let ok = true;
    for (const fragment of fragments) {
      const at = haystack.indexOf(fragment, from);
      if (at < 0) {
        ok = false;
        break;
      }
      from = at + fragment.length;
    }
    if (ok) return line;
  }
  return null;
}
