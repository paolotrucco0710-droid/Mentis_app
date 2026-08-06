import { describe, expect, it } from "vitest";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import type { UserProfileView } from "@/profile/types";

function makeProfile(
  overrides: Partial<UserProfileView> = {}
): UserProfileView {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    firstName: "Paolo",
    lastName: "",
    email: "paolo@mentis.it",
    language: "it",
    timezone: "Europe/Rome",
    schoolGrade: null,
    schoolYear: null,
    personalGoals: [],
    preferences: {
      language: "it",
      timezone: "Europe/Rome",
      notificationsEnabled: true,
      dailyGoalMinutes: null,
      onboardingCompletedAt: null,
    },
    profileImageUrl: null,
    premiumPlan: "free",
    registeredAt: new Date(),
    lastAccessAt: null,
    ...overrides,
  };
}

describe("lib/onboarding", () => {
  it("detects completed onboarding from timestamp", () => {
    const profile = makeProfile({
      preferences: {
        language: "it",
        timezone: "Europe/Rome",
        notificationsEnabled: true,
        dailyGoalMinutes: 30,
        onboardingCompletedAt: "2026-08-06T10:00:00.000Z",
      },
    });

    expect(hasCompletedOnboarding(profile)).toBe(true);
  });

  it("treats legacy personal goals as completed onboarding", () => {
    const profile = makeProfile({
      personalGoals: ["Esami"],
    });

    expect(hasCompletedOnboarding(profile)).toBe(true);
  });

  it("requires onboarding for brand new users", () => {
    expect(hasCompletedOnboarding(makeProfile())).toBe(false);
  });
});
