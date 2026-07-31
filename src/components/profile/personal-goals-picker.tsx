"use client";

import { useState } from "react";
import type { UserProfileView } from "@/profile/types";
import { Button, Chip } from "@/components/ui";
import { ApiError, updateProfile } from "@/lib/api";
import { PERSONAL_GOALS } from "./profile-utils";

export function PersonalGoalsPicker({
  profile,
  onUpdated,
}: {
  profile: UserProfileView;
  onUpdated: (profile: UserProfileView) => void;
}) {
  const [selected, setSelected] = useState<string[]>(profile.personalGoals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function toggleGoal(goal: string) {
    setSelected((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PERSONAL_GOALS.map((goal) => (
          <button key={goal} type="button" onClick={() => toggleGoal(goal)}>
            <Chip
              className={
                selected.includes(goal)
                  ? "border-primary bg-accent text-primary"
                  : undefined
              }
            >
              {goal}
            </Chip>
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button
        type="button"
        disabled={loading}
        onClick={() => {
          void (async () => {
            try {
              setLoading(true);
              setError(null);
              setMessage(null);
              const updated = await updateProfile({ personalGoals: selected });
              onUpdated(updated);
              setMessage("Obiettivi aggiornati.");
            } catch (err) {
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Impossibile salvare gli obiettivi."
              );
            } finally {
              setLoading(false);
            }
          })();
        }}
      >
        {loading ? "Salvataggio..." : "Salva obiettivi"}
      </Button>
    </div>
  );
}
