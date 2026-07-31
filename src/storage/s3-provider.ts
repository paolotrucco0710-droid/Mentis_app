import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "./types";
import { hashBuffer } from "./hash";

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  signedUrlTtlSeconds: number;
}

export function createS3StorageProvider(
  config: S3StorageConfig
): StorageProvider {
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    ...(config.accessKeyId && config.secretAccessKey
      ? {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }
      : {}),
    forcePathStyle: config.forcePathStyle ?? false,
  });

  return {
    async save(storageKey, data, mimeType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: storageKey,
          Body: data,
          ContentType: mimeType,
        })
      );

      return {
        storageKey,
        mimeType,
        sizeBytes: data.length,
        hash: hashBuffer(data),
      };
    },

    async read(storageKey) {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: storageKey,
        })
      );

      if (!response.Body) {
        throw new Error(`Oggetto non trovato nello storage: ${storageKey}`);
      }

      return Buffer.from(await response.Body.transformToByteArray());
    },

    async delete(storageKey) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: storageKey,
        })
      );
    },

    async exists(storageKey) {
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: config.bucket,
            Key: storageKey,
          })
        );
        return true;
      } catch {
        return false;
      }
    },

    async getSignedUrl(storageKey, expiresInSeconds) {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: storageKey,
      });

      return getSignedUrl(client, command, {
        expiresIn: expiresInSeconds ?? config.signedUrlTtlSeconds,
      });
    },
  };
}
