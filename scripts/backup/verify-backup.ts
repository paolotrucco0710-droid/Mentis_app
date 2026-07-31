#!/usr/bin/env npx tsx
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import path from "path";

async function assertReadable(filePath: string): Promise<void> {
  await access(filePath, constants.R_OK);
}

async function main() {
  const dbDumpPath = process.argv[2];
  const manifestPath = process.argv[3] ?? "storage-backup-manifest.json";

  if (!dbDumpPath) {
    console.error(
      "Uso: npx tsx scripts/backup/verify-backup.ts <db-dump.sql.gz> [manifest.json]"
    );
    process.exit(1);
  }

  await assertReadable(dbDumpPath);
  console.log(`OK database dump: ${path.resolve(dbDumpPath)}`);

  await assertReadable(manifestPath);
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw) as {
    imageCount?: number;
    avatarCount?: number;
  };

  if (typeof manifest.imageCount !== "number") {
    throw new Error("Manifest storage non valido: imageCount mancante.");
  }

  console.log(
    `OK storage manifest: ${path.resolve(manifestPath)} (${manifest.imageCount} immagini, ${manifest.avatarCount ?? 0} avatar)`
  );
  console.log("Verifica backup completata.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
