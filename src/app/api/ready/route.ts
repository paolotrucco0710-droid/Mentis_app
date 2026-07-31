import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { env } from "@/lib/env";
import { assertProductionEnv } from "@/lib/env.schema";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

interface ReadinessCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

export async function GET() {
  const checks: ReadinessCheck[] = [];
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "database", ok: true });
  } catch (error) {
    logger.error("Readiness database check failed", error);
    checks.push({
      name: "database",
      ok: false,
      detail: "Database non raggiungibile.",
    });
  }

  if (env.isProduction) {
    try {
      assertProductionEnv(process.env);
      checks.push({ name: "environment", ok: true });
    } catch (error) {
      checks.push({
        name: "environment",
        ok: false,
        detail:
          error instanceof Error ? error.message : "Configurazione non valida.",
      });
    }
  } else {
    checks.push({ name: "environment", ok: true, detail: "development" });
  }

  const ready = checks.every((check) => check.ok);

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "mentis",
      environment: env.nodeEnv,
      checks,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
