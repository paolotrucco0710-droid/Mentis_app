"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SubjectSummary } from "@/course/types";
import type { SubjectId } from "@/domain/ids";
import { fetchSubjects } from "@/lib/api";

const STORAGE_KEY = "mentis.activeSubjectId";

function pickSubject(
  subjects: SubjectSummary[],
  subjectId: string | null
): SubjectSummary | undefined {
  if (!subjectId) {
    return undefined;
  }

  return subjects.find((subject) => subject.id === subjectId);
}

export function useActiveSubjectId(): {
  subjectId: SubjectId | null;
  loading: boolean;
  error: string | null;
} {
  const searchParams = useSearchParams();
  const [subjectId, setSubjectId] = useState<SubjectId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const subjects = await fetchSubjects();
      if (subjects.length === 0) {
        setSubjectId(null);
        setError("Nessuna materia disponibile. Aggiungi una materia per iniziare.");
        return;
      }

      const paramId = searchParams.get("subjectId");
      const storedId = sessionStorage.getItem(STORAGE_KEY);
      const resolved =
        pickSubject(subjects, paramId) ??
        pickSubject(subjects, storedId) ??
        subjects[0];

      setSubjectId(resolved.id as SubjectId);
      sessionStorage.setItem(STORAGE_KEY, resolved.id);
    } catch {
      setSubjectId(null);
      setError("Impossibile caricare le materie.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubject();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSubject]);

  return { subjectId, loading, error };
}
