/** First sentence or clause, trimmed. */
export function firstSentence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? trimmed).trim();
}

const INCOMPLETE_TRUNCATION_TAIL =
  /\b(in|di|a|da|per|con|su|al|del|della|dell'|dei|delle|un|una|che|non|più|meno|modo|forma|senso|termini|parte|fatto)\s*\.?$/iu;

function endsWithIncompleteClause(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.endsWith("…")) {
    return false;
  }

  return INCOMPLETE_TRUNCATION_TAIL.test(trimmed);
}

function truncateAtWordBoundary(value: string, maxLength: number): string {
  const slice = value.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.55) {
    return slice.slice(0, lastSpace).trim();
  }

  return slice.trim();
}

function finalizeTruncation(value: string, source: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (!endsWithIncompleteClause(trimmed)) {
    return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  }

  const extendedLimit = Math.min(source.length, maxLength + 48);
  const nextStop = source.slice(trimmed.length).search(/[.!?]/);

  if (nextStop >= 0) {
    const completed = source.slice(0, trimmed.length + nextStop + 1).trim();
    if (completed.length <= extendedLimit) {
      return completed;
    }
  }

  const chunk = truncateAtWordBoundary(source, maxLength);
  if (chunk.length >= 16 && !endsWithIncompleteClause(chunk)) {
    return chunk.endsWith(".") ? chunk : `${chunk}.`;
  }

  return `${chunk || trimmed}…`;
}

/** Short phrase for cards — avoids dangling prepositions and fake periods. */
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

  const chunk = truncateAtWordBoundary(trimmed, maxLength);
  return finalizeTruncation(chunk, trimmed, maxLength);
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
