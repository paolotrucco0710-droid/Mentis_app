import type { Image } from "@/domain/entities/image";
import type { KnowledgeJsonAtomImage } from "@/domain/knowledge/knowledge-json";
import { isMasterPageStorageKey } from "@/storage";

const CAMERA_FILENAME_PATTERN = /^(IMG_|DSC_|PXL_|MVIMG_|WA\d+)/i;
const IMAGE_FILENAME_PATTERN = /\.(jpe?g|png|heic|webp)$/i;

type ImageSource = Pick<Image, "caption" | "storageKey"> & {
  fallbackToFullPage?: boolean;
  pipelineVersion?: string | null;
};

export function isPageSourceStorageKey(storageKey: string): boolean {
  if (isMasterPageStorageKey(storageKey)) {
    return false;
  }

  return (
    storageKey.includes("/pages/") || storageKey.endsWith("/document.pdf")
  );
}

export function isFigureStorageKey(storageKey: string): boolean {
  return storageKey.includes("/figures/");
}

/**
 * Upload page photos are OCR input — not study illustrations for the feed.
 */
export function isUploadSourcePageImage(image: Pick<Image, "caption">): boolean {
  const caption = image.caption?.trim() ?? "";
  if (!caption) {
    return true;
  }

  if (CAMERA_FILENAME_PATTERN.test(caption)) {
    return true;
  }

  if (IMAGE_FILENAME_PATTERN.test(caption) && !caption.includes(" ")) {
    return true;
  }

  return false;
}

export function isPageSourceImage(image: ImageSource): boolean {
  if (image.fallbackToFullPage) {
    return false;
  }

  if (isPageSourceStorageKey(image.storageKey)) {
    return true;
  }

  return isUploadSourcePageImage(image);
}

export function isStudyIllustrationImage(image: ImageSource): boolean {
  if (image.fallbackToFullPage) {
    return true;
  }

  if (isFigureStorageKey(image.storageKey)) {
    return true;
  }

  if (isPageSourceImage(image)) {
    return false;
  }

  return !isUploadSourcePageImage(image);
}

export function shouldCreateImageExplainCard(
  image: Pick<Image, "caption"> | null | undefined,
  reference?: Pick<KnowledgeJsonAtomImage, "caption" | "description"> | null
): boolean {
  const caption = reference?.caption?.trim() ?? image?.caption?.trim() ?? "";
  if (!caption || isUploadSourcePageImage({ caption })) {
    return false;
  }

  const description = reference?.description?.trim() ?? "";
  if (description.length < 12) {
    return false;
  }

  if (image && isUploadSourcePageImage(image)) {
    return false;
  }

  return true;
}
