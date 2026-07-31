#!/usr/bin/env npx tsx
import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.image.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      storageKey: true,
      hash: true,
      mimeType: true,
      sizeBytes: true,
      knowledgeSourceId: true,
      ownerId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { deletedAt: null, profileImageUrl: { not: null } },
    select: { id: true, profileImageUrl: true },
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    imageCount: images.length,
    avatarCount: users.filter((user) => user.profileImageUrl).length,
    images: images.map((image) => ({
      ...image,
      sizeBytes: Number(image.sizeBytes),
    })),
    avatars: users
      .filter((user) => user.profileImageUrl)
      .map((user) => ({
        userId: user.id,
        storageKey: user.profileImageUrl,
      })),
  };

  const outputPath = process.argv[2] ?? "storage-backup-manifest.json";
  await writeFile(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest scritto in ${outputPath}`);
  console.log(`Oggetti immagine: ${manifest.imageCount}`);
  console.log(`Avatar: ${manifest.avatarCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
