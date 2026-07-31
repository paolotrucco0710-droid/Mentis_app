import { NextResponse } from "next/server";
import { FeedEngineError } from "@/engine/errors";
import { StorageError } from "@/storage/errors";

export function handleStorageRouteError(error: unknown) {
  if (error instanceof StorageError || error instanceof FeedEngineError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Storage API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
