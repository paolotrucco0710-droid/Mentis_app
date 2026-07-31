import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "mentis",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
