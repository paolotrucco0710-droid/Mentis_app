import type { ParsedKnowledgeJson } from "./schema";

export interface SemanticValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateKnowledgeSemantics(
  knowledge: ParsedKnowledgeJson
): SemanticValidationResult {
  const errors: string[] = [];
  const atomIds = new Set(knowledge.atoms.map((atom) => atom.id));

  if (
    new Set(knowledge.atoms.map((atom) => atom.id)).size !==
    knowledge.atoms.length
  ) {
    errors.push("Trovati id Atom duplicati.");
  }

  for (const atom of knowledge.atoms) {
    for (const prerequisiteId of atom.prerequisites) {
      if (!atomIds.has(prerequisiteId)) {
        errors.push(
          `Atom "${atom.id}" ha prerequisito inesistente: ${prerequisiteId}.`
        );
      }
      if (prerequisiteId === atom.id) {
        errors.push(
          `Atom "${atom.id}" non può essere prerequisito di sé stesso.`
        );
      }
    }
  }

  if (hasPrerequisiteCycle(knowledge)) {
    errors.push("Rilevato ciclo nei prerequisiti.");
  }

  return { ok: errors.length === 0, errors };
}

function hasPrerequisiteCycle(knowledge: ParsedKnowledgeJson): boolean {
  const graph = new Map(
    knowledge.atoms.map((atom) => [atom.id, atom.prerequisites])
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visiting.add(nodeId);
    for (const next of graph.get(nodeId) ?? []) {
      if (dfs(next)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  return knowledge.atoms.some((atom) => dfs(atom.id));
}
