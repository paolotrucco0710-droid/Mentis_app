"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Dialog } from "@/components/ui";
import { ApiError, deleteAccount, logout } from "@/lib/api";

export function DeleteAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
  <>
      <Card className="space-y-4 border-danger/30">
        <div>
          <h3 className="text-base font-semibold text-danger">Elimina account</h3>
          <p className="mt-1 text-sm text-muted">
            L&apos;account verrà disattivato e non potrai più accedere.
          </p>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          Elimina account
        </Button>
      </Card>

      <Dialog
        open={open}
        title="Eliminare l'account?"
        description="Questa azione disattiva il tuo account Mentis. Non potrai più accedere con le credenziali attuali."
        confirmLabel="Elimina account"
        destructive
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          void (async () => {
            try {
              setLoading(true);
              setError(null);
              await deleteAccount();
              await logout();
              router.push("/login");
              router.refresh();
            } catch (err) {
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Impossibile eliminare l'account."
              );
              setOpen(false);
            } finally {
              setLoading(false);
            }
          })();
        }}
      />
    </>
  );
}
