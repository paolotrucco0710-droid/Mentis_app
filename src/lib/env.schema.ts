import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  AUTH_JWT_SECRET: z.string().optional(),
  AUTH_DEV_FALLBACK: z.enum(["true", "false"]).optional(),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).optional(),
  STORAGE_BUCKET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export type ParsedEnv = z.infer<typeof envSchema>;

export function parseEnv(
  source: NodeJS.ProcessEnv = process.env
): ParsedEnv {
  return envSchema.parse(source);
}

const WEAK_JWT_SECRETS = new Set([
  "dev-only-change-in-production-mentis",
  "change-me-in-production-use-a-long-random-string",
]);

export interface ProductionValidationIssue {
  field: string;
  message: string;
}

export function collectProductionValidationIssues(
  source: NodeJS.ProcessEnv = process.env
): ProductionValidationIssue[] {
  const issues: ProductionValidationIssue[] = [];
  const nodeEnv = source.NODE_ENV ?? "development";

  if (nodeEnv !== "production") {
    return issues;
  }

  if (!source.DATABASE_URL?.trim()) {
    issues.push({
      field: "DATABASE_URL",
      message: "DATABASE_URL è obbligatorio in produzione.",
    });
  }

  const jwtSecret = source.AUTH_JWT_SECRET ?? "";
  if (!jwtSecret || jwtSecret.length < 32 || WEAK_JWT_SECRETS.has(jwtSecret)) {
    issues.push({
      field: "AUTH_JWT_SECRET",
      message:
        "AUTH_JWT_SECRET deve essere una stringa casuale di almeno 32 caratteri.",
    });
  }

  if (source.AUTH_DEV_FALLBACK === "true") {
    issues.push({
      field: "AUTH_DEV_FALLBACK",
      message: "AUTH_DEV_FALLBACK non può essere true in produzione.",
    });
  }

  if (source.STORAGE_PROVIDER !== "s3") {
    issues.push({
      field: "STORAGE_PROVIDER",
      message: "STORAGE_PROVIDER deve essere impostato su s3 in produzione.",
    });
  }

  if (source.STORAGE_PROVIDER === "s3" && !source.STORAGE_BUCKET?.trim()) {
    issues.push({
      field: "STORAGE_BUCKET",
      message: "STORAGE_BUCKET è obbligatorio con STORAGE_PROVIDER=s3.",
    });
  }

  return issues;
}

export function assertProductionEnv(
  source: NodeJS.ProcessEnv = process.env
): void {
  const issues = collectProductionValidationIssues(source);
  if (issues.length === 0) {
    return;
  }

  const details = issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ");
  throw new Error(`Configurazione produzione non valida: ${details}`);
}

export { positiveInt };
