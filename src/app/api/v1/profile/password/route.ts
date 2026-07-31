import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { changeUserPassword } from "@/profile";
import { handleProfileRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    await changeUserPassword(
      userId,
      body.currentPassword ?? "",
      body.newPassword ?? ""
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleProfileRouteError(error);
  }
}
