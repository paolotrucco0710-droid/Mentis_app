import {
  compactPhrase,
  normalizeForComparison,
} from "./text-snippets";
import type { ErrorDetectionSource } from "./error-detection-options";
import { misconceptionToFalseStatement } from "./error-detection-options";

export interface BlurtingKeyPointSource {
  title: string;
  summary: string;
  definitions?: string[];
  examples?: string[];
  keywords?: string[];
}

function pickDistinctBlurtingKeyword(
  title: string,
  keywords?: string[]
): string | undefined {
  const normalizedTitle = normalizeForComparison(title);
  if (!normalizedTitle) {
    return undefined;
  }

  for (const raw of keywords ?? []) {
    const keyword = raw?.trim();
    if (!keyword) {
      continue;
    }

    const normalizedKeyword = normalizeForComparison(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    if (normalizedKeyword === normalizedTitle) {
      continue;
    }

    if (
      normalizedTitle.includes(normalizedKeyword) ||
      normalizedKeyword.includes(normalizedTitle)
    ) {
      continue;
    }

    return keyword;
  }

  return undefined;
}

export function buildBlurtingMainPrompt(atom: BlurtingKeyPointSource): string {
  const title = atom.title.trim();
  const keyword = pickDistinctBlurtingKeyword(title, atom.keywords);

  if (keyword) {
    return `Con parole tue: cosa ricordi su «${title}» e sul legame con «${keyword}»?`;
  }

  return `Con parole tue: cosa ricordi su «${title}»? Scrivi o parla liberamente, senza guardare gli appunti.`;
}

/** Reference points for AI evaluation — not shown as progressive steps. */
export function buildBlurtingKeyPoints(atom: BlurtingKeyPointSource): string[] {
  const points = [
    ...(atom.definitions ?? []).slice(0, 2),
    ...(atom.examples ?? []).slice(0, 1),
    atom.summary,
  ]
    .filter(Boolean)
    .map((point) => compactPhrase(point, 160));

  return [...new Set(points)].slice(0, 4);
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

  for (const misconception of atom.misconceptions ?? []) {
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

  for (const definition of atom.definitions ?? []) {
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
