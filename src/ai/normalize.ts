import { randomUUID } from "crypto";
import type { ParsedKnowledgeJson } from "./schema";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";
import type { LearningObjective } from "@/domain/enums";
import { env } from "@/lib/env";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toAtomId(id: string): AtomId {
  return id as AtomId;
}

export function normalizeKnowledgeJson(
  knowledge: ParsedKnowledgeJson,
  knowledgeSourceId: string
): KnowledgeJson {
  const idMap = new Map<string, AtomId>();

  for (const atom of knowledge.atoms) {
    const mappedId = UUID_REGEX.test(atom.id)
      ? toAtomId(atom.id)
      : toAtomId(randomUUID());
    idMap.set(atom.id, mappedId);
  }

  const atoms = knowledge.atoms.map((atom, index) => ({
    ...atom,
    id: idMap.get(atom.id)!,
    prerequisites: atom.prerequisites
      .map((prerequisiteId) => idMap.get(prerequisiteId))
      .filter((value): value is AtomId => Boolean(value)),
    learningObjectives: atom.learningObjectives as LearningObjective[],
    pageReferences: atom.pageReferences.length
      ? atom.pageReferences
      : [index + 1],
  }));

  return {
    metadata: {
      ...knowledge.metadata,
      documentId: knowledgeSourceId,
      generatedAt: new Date().toISOString(),
      version: env.knowledgeJsonVersion,
      sourcePages: knowledge.metadata.sourcePages || atoms.length,
    },
    atoms,
  };
}
