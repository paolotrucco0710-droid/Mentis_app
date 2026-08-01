import { env } from "@/lib/env";

const LEARNING_OBJECTIVES = new Set([
  "know",
  "understand",
  "connect",
  "distinguish",
  "apply",
  "recall",
  "transfer",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asNullableString(value: unknown): string | null {
  const text = asString(value);
  return text.length > 0 ? text : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
}

function asRating(value: unknown, fallback = 3): 1 | 2 | 3 | 4 | 5 {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (numeric >= 1 && numeric <= 5) {
    return numeric as 1 | 2 | 3 | 4 | 5;
  }
  return fallback as 1 | 2 | 3 | 4 | 5;
}

function asConfidence(value: unknown, fallback = 0.8): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  const normalized = numeric > 1 ? numeric / 100 : numeric;
  return Math.min(1, Math.max(0, normalized));
}

function asPositiveInt(value: unknown, fallback = 1): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.trunc(numeric);
  }
  return fallback;
}

function asNonNegativeInt(value: unknown, fallback = 0): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.trunc(numeric);
  }
  return fallback;
}

function asLearningObjectives(value: unknown): string[] {
  const objectives = asStringArray(value).filter((item) =>
    LEARNING_OBJECTIVES.has(item)
  );
  return objectives.length > 0 ? objectives : ["understand"];
}

function coerceAtomImage(value: unknown) {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const imageId = asString(record.imageId ?? record.id, "");
  if (!imageId) {
    return null;
  }

  return {
    imageId,
    caption: asNullableString(record.caption),
    description: asNullableString(record.description),
    referencedConcepts: asStringArray(
      record.referencedConcepts ?? record.concepts
    ),
  };
}

function coerceAtom(value: unknown, index: number) {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const title =
    asString(record.title ?? record.name, "") || `Concetto ${index + 1}`;
  const explanation =
    asString(record.explanation ?? record.content ?? record.text, "") ||
    asString(record.summary, "") ||
    title;
  const summary =
    asString(record.summary, "").slice(0, 300) ||
    explanation.slice(0, 300) ||
    title;

  return {
    id: asString(record.id, `atom-${String(index + 1).padStart(3, "0")}`),
    title: title.slice(0, 120),
    summary,
    explanation,
    importance: asRating(record.importance),
    difficulty: asRating(record.difficulty),
    prerequisites: asStringArray(record.prerequisites ?? record.dependsOn),
    learningObjectives: asLearningObjectives(
      record.learningObjectives ?? record.objectives
    ),
    keywords: asStringArray(record.keywords),
    aliases: asStringArray(record.aliases),
    formulas: asStringArray(record.formulas),
    definitions: asStringArray(record.definitions),
    examples: asStringArray(record.examples),
    counterExamples: asStringArray(
      record.counterExamples ?? record.counter_examples
    ),
    commonMistakes: asStringArray(
      record.commonMistakes ?? record.common_mistakes
    ),
    misconceptions: asStringArray(record.misconceptions),
    applications: asStringArray(record.applications),
    historicalContext: asNullableString(
      record.historicalContext ?? record.historical_context
    ),
    notes: asNullableString(record.notes),
    images: asArray(record.images)
      .map((image) => coerceAtomImage(image))
      .filter((image): image is NonNullable<typeof image> => image !== null),
    tables: asStringArray(record.tables),
    diagrams: asStringArray(record.diagrams),
    equations: asStringArray(record.equations),
    citations: asStringArray(record.citations),
    pageReferences: asArray(record.pageReferences ?? record.pages)
      .map((page) => asPositiveInt(page, 0))
      .filter((page) => page > 0),
    confidence: asConfidence(record.confidence),
    quizDistractors: asStringArray(record.quizDistractors).slice(0, 3),
  };
}

function extractAtoms(root: Record<string, unknown>) {
  const candidates = [
    root.atoms,
    root.concepts,
    root.items,
    root.nodes,
    root.knowledgeAtoms,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
}

function coerceMetadata(
  value: unknown,
  atomCount: number
): Record<string, unknown> {
  const record = asRecord(value) ?? {};

  return {
    documentId: asString(record.documentId ?? record.id, "doc-001"),
    title: asString(record.title, "Capitolo"),
    subject: asString(record.subject, "Generale"),
    language: asString(record.language, "it").slice(0, 2) || "it",
    estimatedReadingTimeMinutes: asNonNegativeInt(
      record.estimatedReadingTimeMinutes,
      Math.max(5, atomCount * 2)
    ),
    estimatedStudyTimeMinutes: asNonNegativeInt(
      record.estimatedStudyTimeMinutes,
      Math.max(10, atomCount * 4)
    ),
    chapterNumber:
      record.chapterNumber === null || record.chapterNumber === undefined
        ? null
        : asPositiveInt(record.chapterNumber, 1),
    sourcePages: asPositiveInt(record.sourcePages, Math.max(1, atomCount)),
    generatedAt:
      asString(record.generatedAt, "") || new Date().toISOString(),
    version: asString(record.version, env.knowledgeJsonVersion),
  };
}

export function coerceKnowledgeJson(value: unknown): unknown {
  const root = asRecord(value);
  if (!root) {
    return value;
  }

  const rawAtoms = extractAtoms(root);
  const atoms = rawAtoms
    .map((atom, index) => coerceAtom(atom, index))
    .filter((atom): atom is NonNullable<typeof atom> => atom !== null)
    .map((atom) => ({
      ...atom,
      pageReferences:
        atom.pageReferences.length > 0 ? atom.pageReferences : [1],
    }));

  return {
    metadata: coerceMetadata(root.metadata, atoms.length),
    atoms,
  };
}

export function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}
