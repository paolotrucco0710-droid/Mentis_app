import { env } from "@/lib/env";
import { createLocalStorageProvider } from "./local-provider";
import { createS3StorageProvider } from "./s3-provider";
import type { StorageProvider } from "./types";

export function createStorageProvider(): StorageProvider {
  if (env.storageProvider === "s3") {
    return createS3StorageProvider({
      bucket: env.storageBucket,
      region: env.storageRegion,
      endpoint: env.storageEndpoint || undefined,
      accessKeyId: env.awsAccessKeyId || undefined,
      secretAccessKey: env.awsSecretAccessKey || undefined,
      forcePathStyle: env.storageForcePathStyle,
      signedUrlTtlSeconds: env.storageSignedUrlTtlSeconds,
    });
  }

  return createLocalStorageProvider(
    env.uploadStoragePath,
    env.storageSignedUrlTtlSeconds
  );
}
