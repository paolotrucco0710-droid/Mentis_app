import { NextResponse } from "next/server";
import { AuthError } from "@/auth";

export function handleAuthRouteError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Auth route failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
