import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import {
  deleteUserAccount,
  getUserProfile,
  updateUserProfile,
} from "@/profile";
import { handleProfileRouteError } from "./_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const profile = await getUserProfile(userId);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return handleProfileRouteError(error, {
      route: "/api/v1/profile",
      request,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      schoolGrade?: string | null;
      schoolYear?: string | null;
      personalGoals?: string[];
      preferences?: {
        language?: string;
        timezone?: string;
        notificationsEnabled?: boolean;
        dailyGoalMinutes?: number | null;
      };
      profileImageUrl?: string | null;
    };

    const profile = await updateUserProfile(userId, body);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return handleProfileRouteError(error, {
      route: "/api/v1/profile",
      request,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    await deleteUserAccount(userId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleProfileRouteError(error, {
      route: "/api/v1/profile",
      request,
    });
  }
}
