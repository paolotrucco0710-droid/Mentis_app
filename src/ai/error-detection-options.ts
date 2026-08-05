import {
  compactPhrase,
  isLowQualityStudyText,
  normalizeForComparison,
} from "./text-snippets";

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

function isSameStatement(left: string, right: string): boolean {
  const normalizedLeft = normalizeForComparison(left);
  const normalizedRight = normalizeForComparison(right);

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

export function misconceptionToFalseStatement(value: string): string | null {
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
    statement: compactPhrase(`${atom.title}: ${atom.summary}`, 140),
    correctAnswer: true,
  };
}

export function buildErrorDetectionContent(
  atom: ErrorDetectionSource,
  options: ErrorDetectionOptions = {}
): { flawedText: string; correction: string } | null {
  const excludeStatements = options.excludeStatements ?? [];
  const correction = compactPhrase(atom.definitions[0] ?? atom.summary, 140);

  for (const mistake of atom.commonMistakes) {
    const flawedText = mistakeToFlawedStatement(mistake, atom.title);
    if (
      flawedText &&
      !isExcludedStatement(flawedText, excludeStatements) &&
      !isLowQualityStudyText(flawedText)
    ) {
      return {
        flawedText: compactPhrase(flawedText, 160),
        correction,
      };
    }
  }

  for (const misconception of atom.misconceptions) {
    const flawedText = misconceptionToFalseStatement(misconception);
    if (
      flawedText &&
      !isExcludedStatement(flawedText, excludeStatements) &&
      !isLowQualityStudyText(flawedText)
    ) {
      return {
        flawedText: compactPhrase(flawedText, 160),
        correction: compactPhrase(atom.summary, 140),
      };
    }
  }

  const counterExample = isDeclarativeStatement(atom.counterExamples[0]);
  if (counterExample) {
    const flawedText = compactPhrase(
      `${atom.title} coincide sempre con: ${counterExample}`,
      160
    );
    if (
      !isExcludedStatement(flawedText, excludeStatements) &&
      !isLowQualityStudyText(flawedText)
    ) {
      return {
        flawedText,
        correction,
      };
    }
  }

  return null;
}
