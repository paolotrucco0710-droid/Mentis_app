import {
  compactPhrase,
  normalizeForComparison,
} from "./text-snippets";
import type { ErrorDetectionSource } from "./error-detection-options";
import { misconceptionToFalseStatement } from "./error-detection-options";

export function buildBlurtingKeyPoints(
  atom: Pick<
    ErrorDetectionSource,
    "title" | "summary" | "definitions" | "examples"
  > & { keywords?: string[] }
): string[] {
  const points = [
    ...atom.definitions.slice(0, 2),
    ...atom.examples.slice(0, 1),
    atom.summary,
    ...(atom.keywords ?? []).slice(0, 1).map((keyword) => `${atom.title}: ${keyword}`),
  ]
    .filter(Boolean)
    .map((point) => compactPhrase(point, 90));

  return [...new Set(points)].slice(0, 3);
}

export interface TrueFalseCardContent {
  statement: string;
  correctAnswer: boolean;
}

export function buildTrueFalseCards(
  atom: ErrorDetectionSource
): TrueFalseCardContent[] {
  const cards: TrueFalseCardContent[] = [];
  const used = new Set<string>();

  for (const misconception of atom.misconceptions) {
    const statement = misconceptionToFalseStatement(misconception);
    if (!statement) {
      continue;
    }

    const normalized = normalizeForComparison(statement);
    if (used.has(normalized)) {
      continue;
    }

    cards.push({
      statement: compactPhrase(statement, 140),
      correctAnswer: false,
    });
    used.add(normalized);
    break;
  }

  for (const definition of atom.definitions) {
    const statement = definition.trim();
    if (!statement) {
      continue;
    }

    const normalized = normalizeForComparison(statement);
    if (used.has(normalized)) {
      continue;
    }

    cards.push({
      statement: compactPhrase(statement, 140),
      correctAnswer: true,
    });
    used.add(normalized);
    if (cards.length >= 2) {
      break;
    }
  }

  if (cards.length === 0) {
    cards.push({
      statement: compactPhrase(atom.summary, 140),
      correctAnswer: true,
    });
  }

  return cards.slice(0, 2);
}
