import type { Subject } from "@/domain/entities/subject";
import type { SubjectId } from "@/domain/ids";
import type { SubjectDetail, SubjectSummary } from "@/course/types";
import { apiFetch } from "./client";

export async function fetchSubjects(): Promise<SubjectSummary[]> {
  const data = await apiFetch<{ subjects: SubjectSummary[] }>("/api/v1/subjects");
  return data.subjects;
}

export async function fetchSubjectDetail(
  subjectId: SubjectId
): Promise<SubjectDetail> {
  return apiFetch<SubjectDetail>(`/api/v1/subjects/${subjectId}`);
}

export async function createSubject(input: {
  name: string;
  color: string;
  icon: string;
}): Promise<Subject> {
  const data = await apiFetch<{ subject: Subject }>("/api/v1/subjects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.subject;
}

export async function updateSubject(
  subjectId: SubjectId,
  input: { name?: string; color?: string; icon?: string }
): Promise<Subject> {
  const data = await apiFetch<{ subject: Subject }>(`/api/v1/subjects/${subjectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.subject;
}

export async function deleteSubject(subjectId: SubjectId): Promise<void> {
  await apiFetch(`/api/v1/subjects/${subjectId}`, { method: "DELETE" });
}
