import type { KnowledgeSourceId, SubjectId } from "@/domain/ids";

export function buildFeedScopeKey(
  subjectId: SubjectId,
  knowledgeSourceId?: KnowledgeSourceId | null
): string {
  return `${subjectId}:${knowledgeSourceId ?? ""}`;
}

export function shouldResetFeedForScopeChange(
  previousScope: string | null,
  nextScope: string
): boolean {
  return previousScope !== null && previousScope !== nextScope;
}
