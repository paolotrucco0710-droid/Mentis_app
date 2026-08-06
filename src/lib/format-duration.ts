export function formatStudyDuration(ms: number): string {
  if (ms <= 0) {
    return "0 min";
  }

  const totalMinutes = Math.max(1, Math.round(ms / 60_000));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}
