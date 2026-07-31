import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { getUserStatistics } from "@/profile";
import { handleProfileRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const statistics = await getUserStatistics(userId);
    return NextResponse.json({ statistics }, { status: 200 });
  } catch (error) {
    return handleProfileRouteError(error);
  }
}
