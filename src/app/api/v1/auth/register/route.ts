import { NextResponse } from "next/server";
import {
  getRequestMeta,
  registerUser,
  setAuthCookies,
} from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };

    if (!body.firstName?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json(
        {
          error: "Nome, email e password sono obbligatori.",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const result = await registerUser(
      {
        firstName: body.firstName,
        lastName: body.lastName?.trim() ?? "",
        email: body.email,
        password: body.password,
      },
      getRequestMeta(request)
    );

    const response = NextResponse.json(
      { user: result.user },
      { status: 201 }
    );
    return setAuthCookies(response, result.tokens);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
