"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/notifications/browser-notifications";
import { fetchProfile, updateProfile } from "@/lib/api";

export function StudyReminderPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isNotificationSupported()) {
        return;
      }

      const permission = getNotificationPermission();
      if (permission === "granted" || permission === "denied") {
        return;
      }

      try {
        const profile = await fetchProfile();
        if (!cancelled && profile.preferences.notificationsEnabled) {
          setVisible(true);
        }
      } catch {
        if (!cancelled) {
          setVisible(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-accent/30">
      <CardHeader className="gap-3">
        <CardTitle>Promemoria di studio</CardTitle>
        <CardDescription>
          Attiva le notifiche del browser per ricevere un promemoria quando è
          il momento di ripassare.
        </CardDescription>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            fullWidth
            disabled={loading}
            onClick={() => {
              void (async () => {
                try {
                  setLoading(true);
                  const permission = await requestNotificationPermission();
                  if (permission === "granted") {
                    await updateProfile({
                      preferences: { notificationsEnabled: true },
                    });
                  }
                  setVisible(false);
                } finally {
                  setLoading(false);
                }
              })();
            }}
          >
            {loading ? "Attivazione..." : "Attiva promemoria"}
          </Button>
          <Button fullWidth variant="ghost" onClick={() => setVisible(false)}>
            Non ora
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
