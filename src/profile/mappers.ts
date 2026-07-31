import type { User } from "@/domain/entities";
import type { UserProfileView } from "./types";

export function toUserProfileView(user: User): UserProfileView {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    language: user.language,
    timezone: user.timezone,
    schoolGrade: user.schoolGrade,
    schoolYear: user.schoolYear,
    personalGoals: user.personalGoals,
    preferences: user.preferences,
    profileImageUrl: user.profileImageUrl,
    premiumPlan: user.premiumPlan,
    registeredAt: user.registeredAt,
    lastAccessAt: user.lastAccessAt,
  };
}
