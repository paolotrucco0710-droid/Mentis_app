import { NextResponse } from "next/server";
import { ingestClientEvent } from "@/analytics";
import { resolveDevUserId } from "@/engine/dev";
import { handleAnalyticsRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json()) as {
      name?: string;
      properties?: Record<string, unknown>;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Nome evento obbligatorio.", code: "INVALID_EVENT_NAME" },
        { status: 400 }
      );
    }

    await ingestClientEvent(userId, {
      name: body.name,
      properties: body.properties,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleAnalyticsRouteError(error);
  }
}
