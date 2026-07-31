const nodeEnv = process.env.NODE_ENV ?? "development";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  isProduction: nodeEnv === "production",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  devUserId: process.env.DEV_USER_ID ?? "",
  devSubjectId: process.env.DEV_SUBJECT_ID ?? "",
  feedSessionTargetCards: parsePositiveInt(
    process.env.FEED_SESSION_TARGET_CARDS,
    20
  ),
  uploadStoragePath: process.env.UPLOAD_STORAGE_PATH ?? "./storage/uploads",
  maxUploadFileSizeMb: parsePositiveInt(
    process.env.MAX_UPLOAD_FILE_SIZE_MB,
    20
  ),
  maxUploadFiles: parsePositiveInt(process.env.MAX_UPLOAD_FILES, 50),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  aiVisionModel: process.env.AI_VISION_MODEL ?? "gpt-4o-mini",
  aiReasoningModel: process.env.AI_REASONING_MODEL ?? "gpt-4o-mini",
  knowledgeJsonVersion: process.env.KNOWLEDGE_JSON_VERSION ?? "1.0.0",
  aiPromptVersion: process.env.AI_PROMPT_VERSION ?? "1.0.0",
  autoProcessAfterUpload:
    process.env.AUTO_PROCESS_AFTER_UPLOAD === "true" &&
    Boolean(process.env.OPENAI_API_KEY),
  authJwtSecret:
    process.env.AUTH_JWT_SECRET ?? "dev-only-change-in-production-mentis",
  authAccessTokenTtlMinutes: parsePositiveInt(
    process.env.AUTH_ACCESS_TOKEN_TTL_MINUTES,
    15
  ),
  authRefreshTokenTtlDays: parsePositiveInt(
    process.env.AUTH_REFRESH_TOKEN_TTL_DAYS,
    30
  ),
  authPasswordResetTtlMinutes: parsePositiveInt(
    process.env.AUTH_PASSWORD_RESET_TTL_MINUTES,
    60
  ),
  authDevFallback: process.env.AUTH_DEV_FALLBACK === "true",
  aiMaxConcurrentRequests: parsePositiveInt(
    process.env.AI_MAX_CONCURRENT_REQUESTS,
    3
  ),
  aiMinRequestDelayMs: parsePositiveInt(
    process.env.AI_MIN_REQUEST_DELAY_MS,
    200
  ),
  aiRetryMaxAttempts: parsePositiveInt(process.env.AI_RETRY_MAX_ATTEMPTS, 3),
  aiRetryBaseDelayMs: parsePositiveInt(process.env.AI_RETRY_BASE_DELAY_MS, 1000),
  aiCacheTtlDays: parsePositiveInt(process.env.AI_CACHE_TTL_DAYS, 30),
  aiCostInputPerMillion: Number(process.env.AI_COST_INPUT_PER_MILLION ?? "0.15"),
  aiCostOutputPerMillion: Number(process.env.AI_COST_OUTPUT_PER_MILLION ?? "0.60"),
  aiVisionCostInputPerMillion: Number(
    process.env.AI_VISION_COST_INPUT_PER_MILLION ?? "0.15"
  ),
  aiVisionCostOutputPerMillion: Number(
    process.env.AI_VISION_COST_OUTPUT_PER_MILLION ?? "0.60"
  ),
  aiOcrBatchSize: parsePositiveInt(process.env.AI_OCR_BATCH_SIZE, 3),
  storageProvider:
    process.env.STORAGE_PROVIDER === "s3" ? ("s3" as const) : ("local" as const),
  storageBucket: process.env.STORAGE_BUCKET ?? "",
  storageRegion: process.env.STORAGE_REGION ?? "eu-west-1",
  storageEndpoint: process.env.STORAGE_ENDPOINT ?? "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  storageSignedUrlTtlSeconds: parsePositiveInt(
    process.env.STORAGE_SIGNED_URL_TTL_SECONDS,
    3600
  ),
  storageForcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
  storageSigningSecret:
    process.env.STORAGE_SIGNING_SECRET ??
    process.env.AUTH_JWT_SECRET ??
    "dev-only-change-in-production-mentis",
  queryCacheTtlSeconds: parsePositiveInt(
    process.env.QUERY_CACHE_TTL_SECONDS,
    60
  ),
  serverQueryCacheTtlSeconds: parsePositiveInt(
    process.env.SERVER_QUERY_CACHE_TTL_SECONDS,
    30
  ),
} as const;

export function getMaxUploadFileSizeBytes(): number {
  return env.maxUploadFileSizeMb * 1024 * 1024;
}

export function assertOpenAIConfigured(): void {
  if (!env.openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY non configurato. Aggiungilo nelle variabili ambiente."
    );
  }
}

export function assertStorageConfigured(): void {
  if (env.isProduction && env.storageProvider === "local") {
    throw new Error(
      "STORAGE_PROVIDER deve essere impostato su 's3' in produzione."
    );
  }

  if (env.storageProvider === "s3" && !env.storageBucket) {
    throw new Error("STORAGE_BUCKET è obbligatorio con STORAGE_PROVIDER=s3.");
  }
}
