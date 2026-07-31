export const PERSONAL_GOALS = [
  "Esami",
  "Ripasso quotidiano",
  "Migliorare i voti",
  "Studiare più veloce",
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Europe/Rome", label: "Europe/Rome" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "UTC", label: "UTC" },
] as const;

export function formatStudyMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatPremiumPlan(plan: string): string {
  return plan === "premium" ? "Mentis Premium" : "Mentis Free";
}

export function isStorageKey(value: string): boolean {
  return (
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("data:")
  );
}
