"use client";

import { useState } from "react";
import type { UserProfileView } from "@/profile/types";
import { Button, Input, Switch } from "@/components/ui";
import { ApiError, updateProfile } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/notifications/browser-notifications";
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from "./profile-utils";

export function PreferencesForm({
  profile,
  onUpdated,
}: {
  profile: UserProfileView;
  onUpdated: (profile: UserProfileView) => void;
}) {
  const [language, setLanguage] = useState(profile.preferences.language);
  const [timezone, setTimezone] = useState(profile.preferences.timezone);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile.preferences.notificationsEnabled
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(
    profile.preferences.dailyGoalMinutes?.toString() ?? ""
  );
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
              preferences: {
                language,
                timezone,
                notificationsEnabled,
                dailyGoalMinutes: dailyGoalMinutes
                  ? Number(dailyGoalMinutes)
                  : null,
              },
            });
            if (notificationsEnabled) {
              await requestNotificationPermission();
            }
            onUpdated(updated);
            setMessage("Preferenze salvate.");
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Impossibile salvare le preferenze."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="language" className="text-sm font-medium">
          Lingua
        </label>
        <select
          id="language"
          className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          Fuso orario
        </label>
        <select
          id="timezone"
          className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
        >
          {TIMEZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Switch
        label="Notifiche attive"
        checked={notificationsEnabled}
        onChange={setNotificationsEnabled}
      />

      <Input
        label="Obiettivo giornaliero (minuti)"
        type="number"
        min={5}
        max={240}
        value={dailyGoalMinutes}
        onChange={(event) => setDailyGoalMinutes(event.target.value)}
        placeholder="30"
      />

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvataggio..." : "Salva preferenze"}
      </Button>
    </form>
  );
}
