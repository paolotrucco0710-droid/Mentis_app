export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

export function showStudyReminderNotification(): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  new Notification("Mentis", {
    body: "È un buon momento per rinforzare ciò che hai studiato.",
    icon: "/icon.svg",
    tag: "mentis-study-reminder",
  });
}
