#!/usr/bin/env npx tsx
import { readFile, readdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createS3StorageProvider } from "../src/storage/s3-provider";

const prisma = new PrismaClient();

async function collectLocalFiles(rootPath: string): Promise<string[]> {
  const absoluteRoot = path.resolve(rootPath);
  const files: string[] = [];

  async function walk(currentPath: string) {
    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(path.relative(absoluteRoot, fullPath).split(path.sep).join("/"));
      }
    }
  }

  await walk(absoluteRoot);
  return files;
}

async function main() {
  const localRoot = process.env.UPLOAD_STORAGE_PATH ?? "./storage/uploads";
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION ?? "eu-west-1";

  if (!bucket) {
    throw new Error("STORAGE_BUCKET è obbligatorio per la migrazione.");
  }

  const storage = createS3StorageProvider({
    bucket,
    region,
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
    signedUrlTtlSeconds: 3600,
  });

  const dbKeys = new Set(
    (
      await prisma.image.findMany({
        where: { deletedAt: null },
        select: { storageKey: true },
      })
    ).map((image) => image.storageKey)
  );

  const localKeys = await collectLocalFiles(localRoot);
  const keys = [...new Set([...dbKeys, ...localKeys])];
  let migrated = 0;

  for (const storageKey of keys) {
    const exists = await storage.exists(storageKey);
    if (exists) {
      continue;
    }

    const filePath = path.join(path.resolve(localRoot), storageKey);
    const buffer = await readFile(filePath);
    const mimeType = storageKey.endsWith(".pdf")
      ? "application/pdf"
      : storageKey.endsWith(".png")
        ? "image/png"
        : storageKey.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";

    await storage.save(storageKey, buffer, mimeType);
    migrated += 1;
    console.log(`Migrato: ${storageKey}`);
  }

  console.log(`Migrazione completata. Oggetti caricati: ${migrated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
