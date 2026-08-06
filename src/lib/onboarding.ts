import type { UserProfileView } from "@/profile/types";

export function hasCompletedOnboarding(profile: UserProfileView): boolean {
  if (profile.preferences.onboardingCompletedAt) {
    return true;
  }

  // Legacy users who already completed the previous goals-based onboarding.
  if (profile.personalGoals.length > 0) {
    return true;
  }

  return false;
}
