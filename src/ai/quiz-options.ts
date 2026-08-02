const META_PHRASE_PREFIXES = [
  "pensare che",
  "credere che",
  "confondere",
  "assumere che",
  "sottovalutare",
  "affermazione non corretta",
];

export interface QuizOptionSource {
  id: string;
  title: string;
  summary: string;
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

export function buildQuizOptions(
  atom: QuizOptionSource,
  shuffle: <T>(items: T[], seed: string) => T[]
): {
  question: string;
  options: string[];
  correctOptionIndex: number;
} {
  const question = `Cosa descrive meglio "${atom.title}"?`;
  const correctAnswer = atom.summary;
  const distractors: string[] = [];

  if (atom.quizDistractors && atom.quizDistractors.length > 0) {
    for (const candidate of atom.quizDistractors) {
      const normalized = asDeclarativeQuizOption(candidate);
      if (
        normalized &&
        normalized !== correctAnswer &&
        !distractors.includes(normalized)
      ) {
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
      if (
        normalized &&
        normalized !== correctAnswer &&
        !distractors.includes(normalized)
      ) {
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

  const options = shuffle(
    [correctAnswer, ...distractors.slice(0, 3)],
    atom.id
  );

  return {
    question,
    options,
    correctOptionIndex: options.indexOf(correctAnswer),
  };
}
