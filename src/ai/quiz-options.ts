const META_PHRASE_PREFIXES = [
  "pensare che",
  "credere che",
  "confondere",
  "assumere che",
  "sottovalutare",
  "affermazione non corretta",
];

import { firstSentence, normalizeForComparison } from "./text-snippets";

const LENGTH_BALANCE_MIN_RATIO = 0.75;
const LENGTH_BALANCE_MAX_RATIO = 1.35;

const DANGLING_ENDING_PATTERN =
  /\b(con|con le|con la|con i|con gli|con lo|alle|ai|agli|all|da|di|del|della|dei|delle|e|o|a|in|per|su|che|un|una|uno)\.$/i;

export interface QuizOptionSource {
  id: string;
  title: string;
  summary: string;
  definitions?: string[];
  examples?: string[];
  quizDistractors?: string[];
  misconceptions?: string[];
  counterExamples?: string[];
  commonMistakes?: string[];
}

export function isCompleteQuizSentence(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 12) {
    return false;
  }

  if (!/[.!?]$/.test(trimmed)) {
    return false;
  }

  if (DANGLING_ENDING_PATTERN.test(trimmed)) {
    return false;
  }

  return true;
}

export function asDeclarativeQuizOption(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length < 12 || trimmed.length > 220) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (META_PHRASE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return null;
  }

  if (lower.includes("affermazione non corretta")) {
    return null;
  }

  return trimmed;
}

function averageLength(values: string[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value.length, 0) / values.length;
}

function pickClosestToLength<T extends string>(
  items: T[],
  targetLength: number
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  return [...items].sort(
    (left, right) =>
      Math.abs(left.length - targetLength) - Math.abs(right.length - targetLength)
  )[0];
}

function pickTopByLengthProximity(
  items: string[],
  targetLength: number,
  count: number
): string[] {
  return [...items]
    .sort(
      (left, right) =>
        Math.abs(left.length - targetLength) -
        Math.abs(right.length - targetLength)
    )
    .slice(0, count);
}

function uniqueCompleteOptions(values: string[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  for (const value of values) {
    const normalized = asDeclarativeQuizOption(value);
    if (
      !normalized ||
      seen.has(normalized) ||
      !isCompleteQuizSentence(normalized)
    ) {
      continue;
    }

    seen.add(normalized);
    options.push(normalized);
  }

  return options;
}

export function collectCorrectAnswerCandidates(atom: QuizOptionSource): string[] {
  return uniqueCompleteOptions([
    ...(atom.definitions ?? []),
    ...(atom.definitions ?? []).map(firstSentence),
    atom.summary,
    firstSentence(atom.summary),
  ]);
}

export function collectDistractorCandidates(atom: QuizOptionSource): string[] {
  return uniqueCompleteOptions([
    ...(atom.quizDistractors ?? []),
    ...(atom.misconceptions ?? []),
    ...(atom.counterExamples ?? []),
    ...(atom.commonMistakes ?? []),
  ]);
}

function pickDefaultCorrectAnswer(atom: QuizOptionSource): string {
  const candidates = collectCorrectAnswerCandidates(atom);
  if (candidates.length > 0) {
    return candidates.sort((left, right) => left.length - right.length)[0]!;
  }

  return (
    asDeclarativeQuizOption(firstSentence(atom.summary)) ??
    asDeclarativeQuizOption(atom.summary.trim()) ??
    firstSentence(atom.summary.trim())
  );
}

export function balanceQuizAnswerLength(
  correctAnswer: string,
  distractors: string[],
  alternatives: string[] = []
): string {
  const candidates = [...new Set([correctAnswer, ...alternatives])].filter(
    isCompleteQuizSentence
  );

  if (candidates.length === 0) {
    return correctAnswer;
  }

  if (distractors.length === 0) {
    return pickClosestToLength(candidates, correctAnswer.length) ?? correctAnswer;
  }

  const targetLength = averageLength(distractors);
  const minLength = targetLength * LENGTH_BALANCE_MIN_RATIO;
  const maxLength = targetLength * LENGTH_BALANCE_MAX_RATIO;

  const inBand = candidates.filter(
    (candidate) =>
      candidate.length >= minLength && candidate.length <= maxLength
  );

  if (inBand.length > 0) {
    return pickClosestToLength(inBand, targetLength)!;
  }

  return pickClosestToLength(candidates, targetLength) ?? correctAnswer;
}

export function selectBalancedDistractors(
  candidates: string[],
  correctAnswer: string,
  count: number,
  fallback: string
): string[] {
  const correctNorm = normalizeForComparison(correctAnswer);
  const unique = [...new Set(candidates)].filter(
    (candidate) =>
      isCompleteQuizSentence(candidate) &&
      normalizeForComparison(candidate) !== correctNorm
  );

  const selected = pickTopByLengthProximity(unique, correctAnswer.length, count);

  while (selected.length < count) {
    selected.push(fallback);
  }

  return selected.slice(0, count);
}

export function buildQuizOptions(
  atom: QuizOptionSource,
  shuffle: <T>(items: T[], seed: string) => T[]
): {
  question: string;
  options: string[];
  correctOptionIndex: number;
} {
  const question = `Cosa descrive meglio "${atom.title}"?`;
  const distractorPool = collectDistractorCandidates(atom);
  const correctCandidates = collectCorrectAnswerCandidates(atom);
  const fallbackDistractor = `Questa affermazione non corrisponde al concetto di ${atom.title}.`;

  const seedDistractors =
    distractorPool.length > 0
      ? pickTopByLengthProximity(
          distractorPool,
          averageLength(distractorPool),
          3
        )
      : [];

  const correctAnswer = balanceQuizAnswerLength(
    pickDefaultCorrectAnswer(atom),
    seedDistractors,
    correctCandidates
  );

  const filteredDistractors = selectBalancedDistractors(
    distractorPool,
    correctAnswer,
    3,
    fallbackDistractor
  );

  const options = shuffle([correctAnswer, ...filteredDistractors], atom.id);

  return {
    question,
    options,
    correctOptionIndex: options.indexOf(correctAnswer),
  };
}

export function buildSecondaryQuiz(
  atom: QuizOptionSource,
  shuffle: <T>(items: T[], seed: string) => T[],
  primaryCorrectAnswer: string
): {
  question: string;
  options: string[];
  correctOptionIndex: number;
} | null {
  const factCandidates = [
    ...(atom.definitions ?? []).slice(1),
    ...(atom.examples ?? []),
  ];
  const distractorPool = collectDistractorCandidates(atom);
  const fallbackDistractor = `Questa affermazione non descrive correttamente ${atom.title}.`;

  for (const candidate of factCandidates) {
    const correctAnswer = asDeclarativeQuizOption(candidate);
    if (
      !correctAnswer ||
      !isCompleteQuizSentence(correctAnswer) ||
      correctAnswer === primaryCorrectAnswer ||
      normalizeForComparison(correctAnswer) ===
        normalizeForComparison(primaryCorrectAnswer)
    ) {
      continue;
    }

    const filteredDistractors = selectBalancedDistractors(
      distractorPool.filter(
        (distractor) =>
          distractor !== correctAnswer &&
          distractor !== primaryCorrectAnswer &&
          normalizeForComparison(distractor) !==
            normalizeForComparison(primaryCorrectAnswer)
      ),
      correctAnswer,
      3,
      fallbackDistractor
    );

    const options = shuffle(
      [correctAnswer, ...filteredDistractors],
      `${atom.id}:secondary`
    );

    return {
      question: `Quale affermazione su "${atom.title}" è corretta?`,
      options,
      correctOptionIndex: options.indexOf(correctAnswer),
    };
  }

  return null;
}
