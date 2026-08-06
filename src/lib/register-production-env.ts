import { assertProductionEnv, parseEnv } from "@/lib/env.schema";
import { logger } from "@/lib/logger";

export async function registerProductionEnv(): Promise<void> {
  try {
    parseEnv(process.env);
    assertProductionEnv(process.env);
    logger.info("Environment validation completed");
  } catch (error) {
    logger.error("Environment validation failed", error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}
