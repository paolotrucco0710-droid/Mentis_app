import { ensureChapterForUpload } from "@/course";
import { prisma } from "@/db/client";
import { createKnowledgeSource } from "@/db/repositories/knowledge-sources";
import { findSubjectById } from "@/db/repositories/subjects";
import {
  createImage,
  createUpload,
  findUploadById,
  updateUploadStatus,
} from "@/db/repositories/uploads";
import { findUserById } from "@/db/repositories/users";
import { KnowledgeSourceType, UploadStatus } from "@/domain/enums";
import type {
  CourseId,
  KnowledgeSourceId,
  SubjectId,
  UploadId,
  UserId,
} from "@/domain/ids";
import type { Image, KnowledgeSource, Upload } from "@/domain/entities";
import { env, getMaxUploadFileSizeBytes } from "@/lib/env";
import { AuthError, resolveAuthenticatedUserId } from "@/auth";
import {
  buildPageStorageKey,
  buildPdfStorageKey,
  deleteStorageKeys,
  getStorageProvider,
  hashBuffer,
  type ChapterUploadInput,
  type ChapterUploadResult,
  type UploadFileInput,
} from "@/storage";
import { processImage } from "./image-processing";
import { validateUploadFiles } from "./validation";

export class UploadPipelineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "UploadPipelineError";
  }
}

async function assertUploadPrerequisites(
  userId: UserId,
  subjectId: SubjectId
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new UploadPipelineError(
      "Utente non trovato. Esegui prima npm run db:seed (vedi README).",
      "USER_NOT_FOUND",
      404
    );
  }

  const subject = await findSubjectById(subjectId);
  if (!subject || subject.userId !== userId) {
    throw new UploadPipelineError(
      "Materia non trovata o non appartiene all'utente.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }
}

async function saveImages(
  knowledgeSourceId: KnowledgeSourceId,
  ownerId: UserId,
  files: UploadFileInput[]
): Promise<Image[]> {
  const storage = getStorageProvider();
  const images: Image[] = [];
  const savedKeys: string[] = [];

  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const processed = await processImage(file.buffer, file.mimeType);
      const pageNumber = index + 1;
      const storageKey = buildPageStorageKey(
        knowledgeSourceId,
        pageNumber,
        processed.extension
      );

      const stored = await storage.save(
        storageKey,
        processed.buffer,
        processed.mimeType
      );
      savedKeys.push(stored.storageKey);

      images.push(
        await createImage({
          knowledgeSourceId,
          ownerId,
          storageKey: stored.storageKey,
          hash: stored.hash,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          width: processed.width,
          height: processed.height,
          pageNumber,
          caption: file.originalName,
        })
      );
    }

    return images;
  } catch (error) {
    await deleteStorageKeys(savedKeys);
    throw error;
  }
}

async function savePdf(
  knowledgeSourceId: KnowledgeSourceId,
  ownerId: UserId,
  file: UploadFileInput
): Promise<Image[]> {
  const storage = getStorageProvider();
  const storageKey = buildPdfStorageKey(knowledgeSourceId);

  try {
    const stored = await storage.save(storageKey, file.buffer, file.mimeType);

    return [
      await createImage({
        knowledgeSourceId,
        ownerId,
        storageKey: stored.storageKey,
        hash: stored.hash,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        pageNumber: 1,
        caption: file.originalName,
      }),
    ];
  } catch (error) {
    await deleteStorageKeys([storageKey]);
    throw error;
  }
}

export async function processChapterUpload(
  input: ChapterUploadInput
): Promise<ChapterUploadResult> {
  await assertUploadPrerequisites(input.userId, input.subjectId);

  const validation = validateUploadFiles(input.files, {
    maxFileSizeBytes: getMaxUploadFileSizeBytes(),
    maxFiles: env.maxUploadFiles,
  });

  if (!validation.ok) {
    throw new UploadPipelineError(validation.error, validation.code);
  }

  const { sourceType, normalizedFiles } = validation;
  const combinedHash = hashBuffer(
    Buffer.concat(normalizedFiles.map((file) => file.buffer))
  );
  const totalSizeBytes = normalizedFiles.reduce(
    (sum, file) => sum + file.sizeBytes,
    0
  );

  const knowledgeSource = await createKnowledgeSource({
    userId: input.userId,
    subjectId: input.subjectId,
    title: input.title,
    sourceType,
    pageCount:
      sourceType === KnowledgeSourceType.Pdf ? 1 : normalizedFiles.length,
    language: input.language ?? "it",
    fileSizeBytes: totalSizeBytes,
    fileHash: combinedHash,
  });

  const upload = await createUpload({
    userId: input.userId,
    subjectId: input.subjectId,
    courseId: input.courseId ?? null,
    knowledgeSourceId: knowledgeSource.id,
    status: UploadStatus.Uploading,
    imageIds: [],
  });

  try {
    const images =
      sourceType === KnowledgeSourceType.Pdf
        ? await savePdf(knowledgeSource.id, input.userId, normalizedFiles[0])
        : await saveImages(knowledgeSource.id, input.userId, normalizedFiles);

    await prisma.upload.update({
      where: { id: upload.id },
      data: { imageIds: images.map((image) => image.id) },
    });

    const completedUpload = await updateUploadStatus(
      upload.id,
      UploadStatus.Completed
    );

    const { courseId, chapter } = await ensureChapterForUpload({
      userId: input.userId,
      subjectId: input.subjectId,
      courseId: input.courseId ?? null,
      knowledgeSourceId: knowledgeSource.id,
      title: input.title,
    });

    if (!upload.courseId) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { courseId },
      });
    }

    return {
      upload: { ...completedUpload, imageIds: images.map((image) => image.id), courseId },
      knowledgeSource,
      images,
      combinedHash,
      totalSizeBytes,
      chapter,
    };
  } catch (error) {
    await updateUploadStatus(
      upload.id,
      UploadStatus.Failed,
      error instanceof Error ? error.message : "Upload failed"
    );
    throw error;
  }
}

export async function getUploadResult(
  uploadId: UploadId,
  userId: UserId
): Promise<{ upload: Upload; knowledgeSource: KnowledgeSource | null } | null> {
  const upload = await findUploadById(uploadId);
  if (!upload || upload.userId !== userId) {
    return null;
  }

  const { findKnowledgeSourceById } =
    await import("@/db/repositories/knowledge-sources");

  const knowledgeSource = upload.knowledgeSourceId
    ? await findKnowledgeSourceById(upload.knowledgeSourceId)
    : null;

  return { upload, knowledgeSource };
}

export async function resolveDevUserId(request: Request): Promise<UserId> {
  try {
    return await resolveAuthenticatedUserId(request);
  } catch (error) {
    if (error instanceof AuthError) {
      throw new UploadPipelineError(error.message, error.code, error.statusCode);
    }
    throw error;
  }
}

export function parseCourseId(
  value: FormDataEntryValue | null
): CourseId | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  return value as CourseId;
}

export async function formDataToUploadFiles(
  formData: FormData
): Promise<UploadFileInput[]> {
  const entries = formData.getAll("files");

  return Promise.all(
    entries
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          buffer,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: buffer.length,
        };
      })
  );
}
