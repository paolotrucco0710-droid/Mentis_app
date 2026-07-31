import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: "Email obbligatoria.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(body.email);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
