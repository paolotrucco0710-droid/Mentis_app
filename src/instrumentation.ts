export async function register(): Promise<void> {
  // Next.js 16 bundles instrumentation into the Edge middleware runtime.
  // Avoid importing zod/env validation here so middleware stays lightweight.
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { registerProductionEnv } = await import("@/lib/register-production-env");
  await registerProductionEnv();
}
