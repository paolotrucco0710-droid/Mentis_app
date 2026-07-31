import { NextResponse } from "next/server";
import { getStorageProvider } from "@/storage";
import { verifyStorageAccessSignature } from "@/storage/signed-url";
import { handleStorageRouteError } from "../_helpers";

export const runtime = "nodejs";

function guessMimeType(storageKey: string): string {
  if (storageKey.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (storageKey.endsWith(".png")) {
    return "image/png";
  }
  if (storageKey.endsWith(".webp")) {
    return "image/webp";
  }
  if (storageKey.endsWith(".jpg") || storageKey.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return "application/octet-stream";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storageKey = searchParams.get("key");
    const expires = Number(searchParams.get("expires"));
    const token = searchParams.get("token");

    if (!storageKey || !token || !Number.isFinite(expires)) {
      return NextResponse.json(
        { error: "Parametri non validi.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (!verifyStorageAccessSignature(storageKey, expires, token)) {
      return NextResponse.json(
        { error: "Accesso negato.", code: "ACCESS_DENIED" },
        { status: 403 }
      );
    }

    const buffer = await getStorageProvider().read(storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": guessMimeType(storageKey),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return handleStorageRouteError(error, {
      route: "/api/v1/storage/access",
      request,
    });
  }
}
