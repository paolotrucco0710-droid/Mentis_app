import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { deterministicShuffle } from "./deterministic-shuffle";
import {
  asDeclarativeQuizOption,
  collectDistractorCandidates,
  isCompleteQuizSentence,
  selectBalancedDistractors,
  type QuizOptionSource,
} from "./quiz-options";
import { compactPhrase, firstSentence, normalizeForComparison } from "./text-snippets";

type KnowledgeAtom = KnowledgeJson["atoms"][number];

const TITLE_STOPWORDS = new Set([
  "a",
  "ad",
  "al",
  "all",
  "alla",
  "alle",
  "ai",
  "agli",
  "con",
  "da",
  "dei",
  "del",
  "della",
  "delle",
  "di",
  "e",
  "ed",
  "gli",
  "i",
  "il",
  "in",
  "la",
  "le",
  "lo",
  "o",
  "per",
  "su",
  "un",
  "una",
  "uno",
]);

export function buildConnectionQuestion(
  atomTitle: string,
  prerequisiteTitle: string
): string {
  return `Quale affermazione descrive meglio il rapporto tra «${prerequisiteTitle}» e «${atomTitle}»?`;
}

function toQuizOptionSource(
  atomId: AtomId,
  atom: KnowledgeAtom
): QuizOptionSource {
  return {
    id: atomId,
    title: atom.title,
    summary: atom.summary,
    definitions: atom.definitions,
    examples: atom.examples,
    quizDistractors: atom.quizDistractors,
    misconceptions: atom.misconceptions,
    counterExamples: atom.counterExamples,
    commonMistakes: atom.commonMistakes,
  };
}

function significantTitleTokens(title: string): string[] {
  return title
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((token) => token.length > 2 && !TITLE_STOPWORDS.has(token));
}

function stemsMatch(token: string, word: string): boolean {
  if (word.includes(token) || token.includes(word)) {
    return true;
  }

  const minStem = 5;
  if (token.length < minStem || word.length < minStem) {
    return false;
  }

  const tokenStem = token.slice(0, -1);
  const wordStem = word.slice(0, -1);
  const sharedPrefix = tokenStem.slice(0, minStem);

  return wordStem.startsWith(sharedPrefix) || tokenStem.startsWith(wordStem.slice(0, minStem));
}

function mentionsTitle(text: string, title: string): boolean {
  const normalized = normalizeForComparison(text);
  const tokens = significantTitleTokens(title);

  if (tokens.length === 0) {
    const normalizedTitle = normalizeForComparison(title);
    return normalizedTitle.length > 0 && normalized.includes(normalizedTitle);
  }

  const words = normalized.split(" ");
  const requiredMatches = tokens.length === 1 ? 1 : Math.min(2, tokens.length);
  let matches = 0;

  for (const token of tokens) {
    if (
      normalized.includes(token) ||
      words.some((word) => stemsMatch(token, word))
    ) {
      matches += 1;
    }
  }

  return matches >= requiredMatches;
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);
}

function collectAtomSentences(atom: KnowledgeAtom): string[] {
  const chunks = [
    atom.summary,
    atom.explanation,
    atom.historicalContext,
    atom.notes,
    ...(atom.definitions ?? []),
    ...(atom.examples ?? []),
    ...(atom.applications ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));

  return chunks.flatMap(splitIntoSentences);
}

function uniqueCompleteOptions(values: string[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  for (const value of values) {
    const normalized = asDeclarativeQuizOption(compactPhrase(value, 180));
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

function buildSummaryLinkedStatement(
  prerequisite: KnowledgeAtom,
  atom: KnowledgeAtom,
  template: (prerequisiteSummary: string, atomTitle: string) => string
): string | null {
  const prerequisiteSummary = firstSentence(prerequisite.summary).replace(/\.$/, "");
  if (!prerequisiteSummary) {
    return null;
  }

  return asDeclarativeQuizOption(
    compactPhrase(template(prerequisiteSummary, atom.title), 180)
  );
}

export function buildConnectionCorrectAnswer(
  atom: KnowledgeAtom,
  prerequisite: KnowledgeAtom
): string | null {
  const candidates = uniqueCompleteOptions([
    ...( [
      buildSummaryLinkedStatement(
        prerequisite,
        atom,
        (summary, atomTitle) =>
          `${summary}: è il contesto necessario per interpretare ${atomTitle}.`
      ),
      buildSummaryLinkedStatement(
        prerequisite,
        atom,
        (summary, atomTitle) =>
          `${summary}, e su questo si innesta ${atomTitle}.`
      ),
      buildSummaryLinkedStatement(
        prerequisite,
        atom,
        (summary, atomTitle) =>
          `${summary} Apre la strada alla comprensione di ${atomTitle}.`
      ),
    ].filter((value): value is string => Boolean(value)) ),
    ...collectAtomSentences(atom).filter((sentence) =>
      mentionsTitle(sentence, prerequisite.title)
    ),
    ...collectAtomSentences(prerequisite).filter((sentence) =>
      mentionsTitle(sentence, atom.title)
    ),
    `${prerequisite.title} prepara le basi per capire ${atom.title}.`,
  ]);

  return candidates[0] ?? null;
}

function buildGenericDistractors(
  atom: KnowledgeAtom,
  prerequisite: KnowledgeAtom
): string[] {
  return uniqueCompleteOptions([
    `${atom.title} è prerequisito di ${prerequisite.title}.`,
    `${atom.title} e ${prerequisite.title} sono lo stesso concetto con nomi diversi.`,
    `Capire ${atom.title} non richiede di conoscere ${prerequisite.title}.`,
    `${atom.title} e ${prerequisite.title} non hanno un legame diretto.`,
  ]);
}

export function buildConnectionOptions(
  atom: KnowledgeAtom,
  prerequisite: KnowledgeAtom
): { options: string[]; correctOptionIndex: number } | null {
  const correctStatement = buildConnectionCorrectAnswer(atom, prerequisite);
  if (!correctStatement || !isCompleteQuizSentence(correctStatement)) {
    return null;
  }

  const correctNorm = normalizeForComparison(correctStatement);
  const distractorCandidates = uniqueCompleteOptions([
    ...collectDistractorCandidates(toQuizOptionSource(atom.id, atom)),
    ...collectDistractorCandidates(
      toQuizOptionSource(prerequisite.id, prerequisite)
    ),
    ...collectAtomSentences(atom)
      .filter((sentence) => !mentionsTitle(sentence, prerequisite.title))
      .slice(0, 3),
    ...collectAtomSentences(prerequisite)
      .filter((sentence) => !mentionsTitle(sentence, atom.title))
      .slice(0, 2),
    firstSentence(atom.summary),
    firstSentence(prerequisite.summary),
  ]).filter(
    (option) => normalizeForComparison(option) !== correctNorm
  );

  const genericDistractors = buildGenericDistractors(atom, prerequisite).filter(
    (option) => normalizeForComparison(option) !== correctNorm
  );

  const distractors = selectBalancedDistractors(
    distractorCandidates.length >= 3
      ? distractorCandidates
      : [...distractorCandidates, ...genericDistractors],
    correctStatement,
    3,
    `${atom.title} si comprende a prescindere da ${prerequisite.title}.`
  );

  const options = deterministicShuffle(
    [correctStatement, ...distractors],
    `${atom.id}:${prerequisite.id}`
  );
  const correctOptionIndex = options.indexOf(correctStatement);

  if (correctOptionIndex < 0) {
    return null;
  }

  return { options, correctOptionIndex };
}

export function buildConnectionCardCreateInput(
  atomId: AtomId,
  atom: KnowledgeAtom,
  prerequisite: KnowledgeAtom,
  order: number
): Prisma.CardCreateManyInput | null {
  const quiz = buildConnectionOptions(atom, prerequisite);
  if (!quiz) {
    return null;
  }

  const question = buildConnectionQuestion(atom.title, prerequisite.title);

  return {
    atomId,
    type: CardType.Connection,
    order,
    cognitiveObjective: CognitiveObjective.Connection,
    prompt: question,
    text: question,
    explanation: compactPhrase(atom.explanation, 200),
    correctFeedback: "Hai colto il legame tra i concetti.",
    incorrectFeedback: compactPhrase(prerequisite.summary, 120),
    estimatedDurationSeconds: 25,
    payload: {
      relatedAtomId: prerequisite.id,
      relatedAtomTitle: prerequisite.title,
      relationType: "prerequisite",
      question,
      options: quiz.options,
      correctOptionIndex: quiz.correctOptionIndex,
    } as unknown as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  };
}

export function buildConnectionCardsForAtom(
  atomId: AtomId,
  atom: KnowledgeAtom,
  atomsById: Map<AtomId, KnowledgeAtom>,
  order: number
): { cards: Prisma.CardCreateManyInput[]; nextOrder: number } {
  const cards: Prisma.CardCreateManyInput[] = [];
  let nextOrder = order;

  for (const prerequisiteId of atom.prerequisites) {
    const prerequisite = atomsById.get(prerequisiteId);
    if (!prerequisite) {
      continue;
    }

    const connection = buildConnectionCardCreateInput(
      atomId,
      atom,
      prerequisite,
      nextOrder
    );

    if (connection) {
      cards.push(connection);
      nextOrder += 1;
      break;
    }
  }

  return { cards, nextOrder };
}
