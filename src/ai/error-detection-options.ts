const META_PHRASE_PREFIXES = [
  "pensare che",
  "credere che",
  "confondere",
  "assumere che",
  "sottovalutare",
  "affermazione non corretta",
  "ignorare",
];

export interface ErrorDetectionSource {
  title: string;
  summary: string;
  explanation: string;
  misconceptions: string[];
  commonMistakes: string[];
  definitions: string[];
  counterExamples: string[];
}

function isDeclarativeStatement(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length < 16 || trimmed.length > 240) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (META_PHRASE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return null;
  }

  return trimmed;
}

function mistakeToFlawedStatement(
  mistake: string,
  title: string
): string | null {
  const trimmed = mistake.trim();
  const confoundMatch = trimmed.match(
    /^confondere\s+(.+?)\s+con\s+(.+?)([.,;]|$)/i
  );

  if (confoundMatch) {
    return `${confoundMatch[1]} è sostanzialmente la stessa cosa di ${confoundMatch[2]}.`;
  }

  if (trimmed.toLowerCase().startsWith("pensare che ")) {
    return trimmed.replace(/^pensare che\s+/i, "");
  }

  return isDeclarativeStatement(trimmed);
}

export function buildErrorDetectionContent(
  atom: ErrorDetectionSource
): { flawedText: string; correction: string } {
  const correction = atom.definitions[0] ?? atom.summary;

  for (const candidate of atom.misconceptions) {
    const flawedText = isDeclarativeStatement(candidate);
    if (flawedText) {
      return { flawedText, correction: atom.summary };
    }
  }

  for (const mistake of atom.commonMistakes) {
    const flawedText = mistakeToFlawedStatement(mistake, atom.title);
    if (flawedText) {
      return { flawedText, correction };
    }
  }

  const counterExample = isDeclarativeStatement(atom.counterExamples[0]);
  if (counterExample) {
    return {
      flawedText: `${atom.title} si riduce a: ${counterExample}`,
      correction,
    };
  }

  return {
    flawedText: `${atom.title} non ha alcun legame con: ${atom.summary}`,
    correction,
  };
}
