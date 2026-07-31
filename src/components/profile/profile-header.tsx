"use client";

import type { UserProfileView } from "@/profile/types";
import { Avatar, Badge, Card } from "@/components/ui";
import { formatPremiumPlan } from "./profile-utils";

export function ProfileHeader({ profile }: { profile: UserProfileView }) {
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <Card>
      <div className="flex items-center gap-4">
        <Avatar
          name={displayName || profile.email}
          src={profile.profileImageUrl}
          className="h-16 w-16 text-lg"
        />
        <div>
          <h2 className="text-xl font-semibold">{displayName || profile.email}</h2>
          <p className="text-sm text-muted">{profile.email}</p>
          {(profile.schoolGrade || profile.schoolYear) && (
            <p className="mt-1 text-sm text-muted">
              {[profile.schoolGrade, profile.schoolYear].filter(Boolean).join(" · ")}
            </p>
          )}
          <Badge className="mt-2" variant="accent">
            Piano {formatPremiumPlan(profile.premiumPlan)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
