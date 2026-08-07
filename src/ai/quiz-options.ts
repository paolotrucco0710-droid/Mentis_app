const META_PHRASE_PREFIXES = [
  "pensare che",
  "credere che",
  "confondere",
  "assumere che",
  "sottovalutare",
  "affermazione non corretta",
];

import { firstSentence, normalizeForComparison } from "./text-snippets";

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

function pickCorrectAnswer(atom: QuizOptionSource): string {
  const candidates = [
    ...(atom.definitions ?? []).map(asDeclarativeQuizOption),
    asDeclarativeQuizOption(atom.summary),
    asDeclarativeQuizOption(firstSentence(atom.summary)),
  ].filter((value): value is string => Boolean(value));

  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length === 0) {
    return (
      asDeclarativeQuizOption(firstSentence(atom.summary)) ??
      asDeclarativeQuizOption(atom.summary.trim()) ??
      firstSentence(atom.summary.trim())
    );
  }

  return uniqueCandidates.sort((left, right) => left.length - right.length)[0]!;
}

export function balanceQuizAnswerLength(
  correctAnswer: string,
  distractors: string[]
): string {
  void distractors;
  // Quiz options must stay complete sentences; never shorten mid-clause to match
  // distractor length (that produced answers ending with "con.", "alle.", "e.", etc.).
  return correctAnswer;
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
  const distractors: string[] = [];

  if (atom.quizDistractors && atom.quizDistractors.length > 0) {
    for (const candidate of atom.quizDistractors) {
      const normalized = asDeclarativeQuizOption(candidate);
      if (normalized && !distractors.includes(normalized)) {
        distractors.push(normalized);
      }
      if (distractors.length >= 3) {
        break;
      }
    }
  }

  if (distractors.length < 3) {
    for (const candidate of [
      ...(atom.misconceptions ?? []),
      ...(atom.counterExamples ?? []),
    ]) {
      const normalized = asDeclarativeQuizOption(candidate);
      if (normalized && !distractors.includes(normalized)) {
        distractors.push(normalized);
      }
      if (distractors.length >= 3) {
        break;
      }
    }
  }

  while (distractors.length < 3) {
    distractors.push(
      `Questa affermazione non corrisponde al concetto di ${atom.title}.`
    );
  }

  const correctAnswer = balanceQuizAnswerLength(
    pickCorrectAnswer(atom),
    distractors.slice(0, 3)
  );
  const filteredDistractors = distractors
    .filter((distractor) => distractor !== correctAnswer)
    .slice(0, 3);

  while (filteredDistractors.length < 3) {
    filteredDistractors.push(
      `Questa affermazione non corrisponde al concetto di ${atom.title}.`
    );
  }

  const compactCorrect = correctAnswer;
  const compactDistractors = filteredDistractors.slice(0, 3);
  const options = shuffle(
    [compactCorrect, ...compactDistractors],
    atom.id
  );

  return {
    question,
    options,
    correctOptionIndex: options.indexOf(compactCorrect),
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

  for (const candidate of factCandidates) {
    const correctAnswer = asDeclarativeQuizOption(candidate);
    if (
      !correctAnswer ||
      correctAnswer === primaryCorrectAnswer ||
      normalizeForComparison(correctAnswer) ===
        normalizeForComparison(primaryCorrectAnswer)
    ) {
      continue;
    }

    const distractors = (atom.quizDistractors ?? [])
      .map(asDeclarativeQuizOption)
      .filter(
        (value): value is string =>
          Boolean(value) &&
          value !== correctAnswer &&
          value !== primaryCorrectAnswer
      )
      .slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(
        `Questa affermazione non descrive correttamente ${atom.title}.`
      );
    }

    const options = shuffle(
      [correctAnswer, ...distractors.slice(0, 3)],
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
