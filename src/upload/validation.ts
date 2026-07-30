import { KnowledgeSourceType } from "@/domain/enums";
import type { UploadFileInput } from "@/storage";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_PDF_TYPES = new Set(["application/pdf"]);

export interface UploadValidationRules {
  maxFileSizeBytes: number;
  maxFiles: number;
}

export type UploadValidationResult =
  | {
      ok: true;
      sourceType: KnowledgeSourceType;
      normalizedFiles: UploadFileInput[];
    }
  | {
      ok: false;
      code: string;
      error: string;
    };

function isPdfFile(file: UploadFileInput): boolean {
  return ALLOWED_PDF_TYPES.has(file.mimeType);
}

function isImageFile(file: UploadFileInput): boolean {
  return ALLOWED_IMAGE_TYPES.has(file.mimeType);
}

export function validateUploadFiles(
  files: UploadFileInput[],
  rules: UploadValidationRules
): UploadValidationResult {
  if (files.length === 0) {
    return {
      ok: false,
      code: "NO_FILES",
      error: "Devi caricare almeno un file.",
    };
  }

  if (files.length > rules.maxFiles) {
    return {
      ok: false,
      code: "TOO_MANY_FILES",
      error: `Puoi caricare al massimo ${rules.maxFiles} file per capitolo.`,
    };
  }

  const hasPdf = files.some(isPdfFile);
  const hasImage = files.some(isImageFile);

  if (hasPdf && hasImage) {
    return {
      ok: false,
      code: "MIXED_TYPES",
      error: "Non puoi mescolare PDF e immagini nello stesso upload.",
    };
  }

  if (hasPdf && files.length > 1) {
    return {
      ok: false,
      code: "MULTIPLE_PDF",
      error: "Puoi caricare un solo PDF per volta.",
    };
  }

  if (!hasPdf && !hasImage) {
    return {
      ok: false,
      code: "INVALID_TYPE",
      error: "Formati supportati: JPEG, PNG, WebP, HEIC o PDF.",
    };
  }

  for (const file of files) {
    if (file.sizeBytes > rules.maxFileSizeBytes) {
      return {
        ok: false,
        code: "FILE_TOO_LARGE",
        error: `Il file "${file.originalName}" supera il limite di ${Math.round(rules.maxFileSizeBytes / 1024 / 1024)} MB.`,
      };
    }

    if (file.buffer.length === 0) {
      return {
        ok: false,
        code: "EMPTY_FILE",
        error: `Il file "${file.originalName}" è vuoto.`,
      };
    }
  }

  const sourceType = hasPdf
    ? KnowledgeSourceType.Pdf
    : KnowledgeSourceType.Photograph;

  return {
    ok: true,
    sourceType,
    normalizedFiles: files,
  };
}
