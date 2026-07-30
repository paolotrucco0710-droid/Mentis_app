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
  /** Temporary dev user until Milestone 13 (Auth). */
  devUserId: process.env.DEV_USER_ID ?? "",
  uploadStoragePath: process.env.UPLOAD_STORAGE_PATH ?? "./storage/uploads",
  maxUploadFileSizeMb: parsePositiveInt(
    process.env.MAX_UPLOAD_FILE_SIZE_MB,
    20
  ),
  maxUploadFiles: parsePositiveInt(process.env.MAX_UPLOAD_FILES, 50),
} as const;

export function getMaxUploadFileSizeBytes(): number {
  return env.maxUploadFileSizeMb * 1024 * 1024;
}
