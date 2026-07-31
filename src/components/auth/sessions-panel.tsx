"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSessionView } from "@/auth/types";
import {
  ApiError,
  fetchAuthSessions,
  revokeAuthSession,
} from "@/lib/api";
import { Badge, Button, Card, Loader } from "@/components/ui";

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sessionLabel(session: AuthSessionView): string {
  return session.deviceLabel?.trim() || session.userAgent?.trim() || "Dispositivo sconosciuto";
}

export function SessionsPanel() {
  const [sessions, setSessions] = useState<AuthSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuthSessions();
      setSessions(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossibile caricare le sessioni."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleRevoke(sessionId: string) {
    try {
      setRevokingId(sessionId);
      setError(null);
      await revokeAuthSession(sessionId);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossibile revocare la sessione."
      );
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return (
      <Card className="flex justify-center py-10">
        <Loader />
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {sessions.length === 0 ? (
        <p className="text-sm text-muted">Nessuna sessione attiva.</p>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{sessionLabel(session)}</p>
                  {session.current ? (
                    <Badge variant="accent">Sessione corrente</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted">
                  Creata il {formatDate(session.createdAt)}
                  {session.lastUsedAt
                    ? ` · Ultimo accesso ${formatDate(session.lastUsedAt)}`
                    : null}
                </p>
                {session.ipAddress ? (
                  <p className="text-xs text-muted">IP: {session.ipAddress}</p>
                ) : null}
              </div>
              {!session.current ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={revokingId === session.id}
                  onClick={() => void handleRevoke(session.id)}
                >
                  {revokingId === session.id ? "Revoca..." : "Revoca"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
