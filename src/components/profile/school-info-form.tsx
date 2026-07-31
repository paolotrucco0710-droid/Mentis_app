"use client";

import { useState } from "react";
import type { UserProfileView } from "@/profile/types";
import { Button, Input } from "@/components/ui";
import { ApiError, updateProfile } from "@/lib/api";

export function SchoolInfoForm({
  profile,
  onUpdated,
}: {
  profile: UserProfileView;
  onUpdated: (profile: UserProfileView) => void;
}) {
  const [schoolGrade, setSchoolGrade] = useState(profile.schoolGrade ?? "");
  const [schoolYear, setSchoolYear] = useState(profile.schoolYear ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            setMessage(null);
            const updated = await updateProfile({
              schoolGrade: schoolGrade || null,
              schoolYear: schoolYear || null,
            });
            onUpdated(updated);
            setMessage("Informazioni scolastiche salvate.");
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Impossibile salvare le informazioni."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <Input
        label="Classe"
        placeholder="Es. 3A"
        value={schoolGrade}
        onChange={(event) => setSchoolGrade(event.target.value)}
      />
      <Input
        label="Anno scolastico"
        placeholder="Es. 2025/2026"
        value={schoolYear}
        onChange={(event) => setSchoolYear(event.target.value)}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}
