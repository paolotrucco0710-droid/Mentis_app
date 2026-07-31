import { NextResponse } from "next/server";
import { AnalyticsError } from "@/analytics";
import { FeedEngineError } from "@/engine/errors";

export function handleAnalyticsRouteError(error: unknown) {
  if (error instanceof AnalyticsError || error instanceof FeedEngineError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Analytics API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
