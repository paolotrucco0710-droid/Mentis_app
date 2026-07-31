import { NextResponse } from "next/server";
import {
  getRequestMeta,
  loginUser,
  setAuthCookies,
} from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email?.trim() || !body.password) {
      return NextResponse.json(
        {
          error: "Email e password sono obbligatori.",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const result = await loginUser(
      {
        email: body.email,
        password: body.password,
      },
      getRequestMeta(request)
    );

    const response = NextResponse.json({ user: result.user }, { status: 200 });
    return setAuthCookies(response, result.tokens);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
