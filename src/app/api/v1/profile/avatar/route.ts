import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { ProfileError, uploadUserAvatar } from "@/profile";
import { getAvatarSignedUrlForUser } from "@/storage/access-service";
import { handleProfileRouteError } from "../../profile/_helpers";
import { handleStorageRouteError } from "../../storage/_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const result = await getAvatarSignedUrlForUser(userId);

    if (!result) {
      return NextResponse.json(
        { error: "Avatar non configurato.", code: "AVATAR_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleStorageRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "File immagine obbligatorio.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const profile = await uploadUserAvatar(userId, {
      buffer,
      mimeType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    if (error instanceof ProfileError) {
      return handleProfileRouteError(error);
    }
    return handleStorageRouteError(error);
  }
}
