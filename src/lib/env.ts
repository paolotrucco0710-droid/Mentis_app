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
