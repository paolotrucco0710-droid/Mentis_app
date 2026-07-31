"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { ApiError, changePassword, logout } from "@/lib/api";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
          setError("Le password non coincidono.");
          return;
        }
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            setMessage(null);
            await changePassword({ currentPassword, newPassword });
            setMessage("Password aggiornata. Effettua di nuovo l'accesso.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            await logout();
            router.push("/login");
            router.refresh();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Impossibile aggiornare la password."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <Input
        label="Password attuale"
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
      />
      <Input
        label="Nuova password"
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        minLength={8}
        required
      />
      <Input
        label="Conferma nuova password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        minLength={8}
        required
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvataggio..." : "Cambia password"}
      </Button>
    </form>
  );
}
