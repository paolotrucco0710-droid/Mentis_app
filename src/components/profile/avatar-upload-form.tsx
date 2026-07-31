"use client";

import { useRef, useState } from "react";
import type { UserProfileView } from "@/profile/types";
import { Button } from "@/components/ui";
import { ApiError, uploadAvatar } from "@/lib/api";
import { StorageAvatar } from "@/components/storage/storage-avatar";

export function AvatarUploadForm({
  profile,
  onUpdated,
}: {
  profile: UserProfileView;
  onUpdated: (profile: UserProfileView) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <StorageAvatar
        name={displayName || profile.email}
        imageRef={profile.profileImageUrl}
        className="h-16 w-16 text-lg"
      />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            void (async () => {
              try {
                setLoading(true);
                setError(null);
                setMessage(null);
                const updated = await uploadAvatar(file);
                onUpdated(updated);
                setMessage("Avatar aggiornato.");
              } catch (err) {
                setError(
                  err instanceof ApiError
                    ? err.message
                    : "Impossibile caricare l'avatar."
                );
              } finally {
                setLoading(false);
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }
            })();
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Caricamento..." : "Carica foto profilo"}
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-muted">{message}</p> : null}
        <p className="text-xs text-muted">
          Le immagini vengono salvate nello storage cloud configurato.
        </p>
      </div>
    </div>
  );
}
