/** First sentence or clause, trimmed. */
export function firstSentence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? trimmed).trim();
}

/** Short phrase for cards — never cuts mid-word without punctuation. */
export function compactPhrase(value: string, maxLength = 120): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const sentence = firstSentence(trimmed);
  if (sentence.length <= maxLength) {
    return sentence;
  }

  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.55) {
    const chunk = slice.slice(0, lastSpace).trim();
    if (chunk.length >= 16) {
      return chunk.endsWith(".") ? chunk : `${chunk}.`;
    }
  }

  return `${sentence.slice(0, maxLength).trim()}.`;
}

export function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLowQualityStudyText(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("senza altre implicazioni storiche") ||
    normalized.includes("riguarda solo") ||
    /\b(i|il|la|lo|gli|le),\s*senza\b/i.test(value) ||
    /,\s*i,\s*/.test(value)
  );
}
