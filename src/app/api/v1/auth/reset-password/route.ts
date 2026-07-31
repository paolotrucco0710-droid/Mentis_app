import { NextResponse } from "next/server";
import { resetPassword } from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!body.token || !body.password) {
      return NextResponse.json(
        {
          error: "Token e nuova password sono obbligatori.",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    await resetPassword({
      token: body.token,
      password: body.password,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
