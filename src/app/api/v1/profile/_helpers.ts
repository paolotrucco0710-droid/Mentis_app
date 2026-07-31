import { NextResponse } from "next/server";
import { FeedEngineError } from "@/engine/errors";
import { ProfileError } from "@/profile";

export function handleProfileRouteError(error: unknown) {
  if (error instanceof ProfileError || error instanceof FeedEngineError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Profile API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
