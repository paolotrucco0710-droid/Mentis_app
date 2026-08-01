import { asDeclarativeQuizOption } from "./quiz-options";

const META_PHRASE_PATTERNS = [
  /^pensare che\s+/i,
  /^credere che\s+/i,
  /^assumere che\s+/i,
  /^sottovalutare che\s+/i,
];

export interface ErrorDetectionSource {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  definitions: string[];
  errorDetectionStatement?: string;
  errorDetectionCorrection?: string;
  quizDistractors?: string[];
  misconceptions?: string[];
  commonMistakes?: string[];
}

export function normalizeErrorDetectionStatement(value: string): string {
  let text = value.trim();
  if (!text) {
    return text;
  }

  for (const pattern of META_PHRASE_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, "");
      text = text.charAt(0).toUpperCase() + text.slice(1);
      break;
    }
  }

  text = text.replace(/\bfosse\b/gi, "fu");
  text = text.replace(/\bfossero\b/gi, "furono");
  text = text.replace(/\besse\b/gi, "era");

  if (!/[.!?]$/.test(text)) {
    text = `${text}.`;
  }

  return text;
}

function pickFalseStatement(
  atom: ErrorDetectionSource,
  correction: string
): string | null {
  const candidates = [
    atom.errorDetectionStatement,
    ...(atom.quizDistractors ?? []),
    ...(atom.misconceptions ?? []),
    ...(atom.commonMistakes ?? []),
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) {
      continue;
    }

    const direct = asDeclarativeQuizOption(candidate);
    if (
      direct &&
      direct !== correction &&
      direct !== atom.summary
    ) {
      return direct;
    }

    const normalized = normalizeErrorDetectionStatement(candidate);
    if (
      normalized.length >= 12 &&
      normalized.length <= 220 &&
      normalized !== correction &&
      normalized !== atom.summary &&
      !META_PHRASE_PATTERNS.some((pattern) => pattern.test(normalized))
    ) {
      return normalized;
    }
  }

  return null;
}

export function buildErrorDetectionContent(atom: ErrorDetectionSource): {
  text: string;
  hasError: boolean;
  correction: string;
} {
  const correction =
    asDeclarativeQuizOption(atom.errorDetectionCorrection) ??
    atom.definitions[0]?.trim() ??
    atom.summary;

  const falseStatement = pickFalseStatement(atom, correction);

  if (falseStatement) {
    return {
      text: falseStatement,
      hasError: true,
      correction,
    };
  }

  return {
    text: `La definizione standard di "${atom.title}" non corrisponde al processo descritto nel capitolo.`,
    hasError: true,
    correction,
  };
}
