import { describe, expect, it } from "vitest";
import {
  getNotificationPermission,
  isNotificationSupported,
} from "@/lib/notifications/browser-notifications";

describe("notifications/browser-notifications", () => {
  it("reports unsupported notifications without window", () => {
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBe("unsupported");
  });
});
