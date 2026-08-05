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

export interface ErrorDetectionOptions {
  excludeStatements?: string[];
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

function normalizeStatement(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameStatement(left: string, right: string): boolean {
  const normalizedLeft = normalizeStatement(left);
  const normalizedRight = normalizeStatement(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function isExcludedStatement(
  statement: string,
  excludeStatements: string[] = []
): boolean {
  return excludeStatements.some((excluded) =>
    isSameStatement(statement, excluded)
  );
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
    return `Per "${title}", ${confoundMatch[1]} è sostanzialmente la stessa cosa di ${confoundMatch[2]}.`;
  }

  if (trimmed.toLowerCase().startsWith("pensare che ")) {
    return trimmed.replace(/^pensare che\s+/i, "");
  }

  return isDeclarativeStatement(trimmed);
}

function misconceptionToFalseStatement(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let statement = trimmed;
  if (statement.toLowerCase().startsWith("pensare che ")) {
    statement = statement.replace(/^pensare che\s+/i, "");
  }

  statement = statement.replace(/[.?!…]+$/, "").trim();
  if (statement.length < 16 || statement.length > 220) {
    return null;
  }

  const lower = statement.toLowerCase();
  if (META_PHRASE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return null;
  }

  return statement.charAt(0).toUpperCase() + statement.slice(1) + ".";
}

function buildSummaryFlaw(title: string, summary: string): string {
  const summarySnippet = summary
    .replace(/[.?!…]+$/, "")
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");

  return `${title} riguarda solo ${summarySnippet}, senza altre implicazioni storiche.`;
}

export function buildTrueFalseContent(
  atom: ErrorDetectionSource
): { statement: string; correctAnswer: boolean } {
  for (const misconception of atom.misconceptions) {
    const statement = misconceptionToFalseStatement(misconception);
    if (statement) {
      return { statement, correctAnswer: false };
    }
  }

  const definition = isDeclarativeStatement(atom.definitions[0]);
  if (definition) {
    return { statement: definition, correctAnswer: true };
  }

  return {
    statement: `${atom.title}: ${atom.summary}`,
    correctAnswer: true,
  };
}

export function buildErrorDetectionContent(
  atom: ErrorDetectionSource,
  options: ErrorDetectionOptions = {}
): { flawedText: string; correction: string } {
  const excludeStatements = options.excludeStatements ?? [];
  const correction = atom.definitions[0] ?? atom.summary;

  for (const mistake of atom.commonMistakes) {
    const flawedText = mistakeToFlawedStatement(mistake, atom.title);
    if (flawedText && !isExcludedStatement(flawedText, excludeStatements)) {
      return { flawedText, correction };
    }
  }

  for (const misconception of atom.misconceptions) {
    const flawedText = misconceptionToFalseStatement(misconception);
    if (flawedText && !isExcludedStatement(flawedText, excludeStatements)) {
      return { flawedText, correction: atom.summary };
    }
  }

  const counterExample = isDeclarativeStatement(atom.counterExamples[0]);
  if (counterExample) {
    const flawedText = `${atom.title} si riduce a: ${counterExample}`;
    if (!isExcludedStatement(flawedText, excludeStatements)) {
      return {
        flawedText,
        correction,
      };
    }
  }

  const definition = isDeclarativeStatement(atom.definitions[0]);
  if (definition && !isExcludedStatement(definition, excludeStatements)) {
    return {
      flawedText: buildSummaryFlaw(atom.title, atom.summary),
      correction: definition,
    };
  }

  const fallback = buildSummaryFlaw(atom.title, atom.summary);
  if (!isExcludedStatement(fallback, excludeStatements)) {
    return {
      flawedText: fallback,
      correction,
    };
  }

  return {
    flawedText: `${atom.title} non ha alcun legame con: ${atom.summary}`,
    correction,
  };
}
