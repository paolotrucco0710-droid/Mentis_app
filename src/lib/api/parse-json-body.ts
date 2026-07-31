import { NextResponse } from "next/server";

export async function parseJsonBody<T>(
  request: Request
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Corpo della richiesta mancante.",
          code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawBody) as T,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "JSON non valido.",
          code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }
}
