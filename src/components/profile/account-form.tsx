"use client";

import { useState } from "react";
import type { UserProfileView } from "@/profile/types";
import { Button, Input } from "@/components/ui";
import { ApiError, updateProfile } from "@/lib/api";

export function AccountForm({
  profile,
  onUpdated,
}: {
  profile: UserProfileView;
  onUpdated: (profile: UserProfileView) => void;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
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
            const updated = await updateProfile({ firstName, lastName });
            onUpdated(updated);
            setMessage("Profilo aggiornato.");
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Impossibile aggiornare il profilo."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <Input
        label="Nome"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        required
      />
      <Input
        label="Cognome"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
      />
      <Input label="Email" value={profile.email} readOnly />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvataggio..." : "Salva modifiche"}
      </Button>
    </form>
  );
}
