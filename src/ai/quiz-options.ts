const META_PHRASE_PREFIXES = [
  "pensare che",
  "credere che",
  "confondere",
  "assumere che",
  "sottovalutare",
  "affermazione non corretta",
];


const LENGTH_BALANCE_RATIO = 1.3;

export interface QuizOptionSource {
  id: string;
  title: string;
  summary: string;
  definitions?: string[];
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

function firstSentence(value: string): string {
  const match = value.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? value).trim();
}

function pickCorrectAnswer(atom: QuizOptionSource): string {
  const candidates = [
    ...(atom.definitions ?? []).map(asDeclarativeQuizOption),
    asDeclarativeQuizOption(atom.summary),
    asDeclarativeQuizOption(firstSentence(atom.summary)),
  ].filter((value): value is string => Boolean(value));

  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length === 0) {
    return atom.summary.trim();
  }

  return uniqueCandidates.sort((left, right) => left.length - right.length)[0]!;
}

function averageLength(values: string[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value.length, 0) / values.length;
}

function shortenToTargetLength(value: string, targetLength: number): string {
  if (value.length <= targetLength) {
    return value;
  }

  const truncated = value.slice(0, targetLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > targetLength * 0.6) {
    return `${truncated.slice(0, lastSpace).trim()}.`;
  }

  return `${truncated.trim()}.`;
}

export function balanceQuizAnswerLength(
  correctAnswer: string,
  distractors: string[]
): string {
  if (distractors.length === 0) {
    return correctAnswer;
  }

  const distractorAverage = averageLength(distractors);
  if (distractorAverage === 0) {
    return correctAnswer;
  }

  const targetLength = Math.round(distractorAverage * 1.1);

  if (correctAnswer.length <= distractorAverage * LENGTH_BALANCE_RATIO) {
    return correctAnswer;
  }

  const shorterCandidates = [
    asDeclarativeQuizOption(firstSentence(correctAnswer)),
    shortenToTargetLength(correctAnswer, targetLength),
  ].filter((value): value is string => Boolean(value));

  const balanced = shorterCandidates.find(
    (value) =>
      value.length >= distractorAverage * 0.75 &&
      value.length <= distractorAverage * LENGTH_BALANCE_RATIO
  );

  return balanced ?? shorterCandidates[0] ?? correctAnswer;
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

  const options = shuffle(
    [correctAnswer, ...filteredDistractors.slice(0, 3)],
    atom.id
  );

  return {
    question,
    options,
    correctOptionIndex: options.indexOf(correctAnswer),
  };
}
