import type { Image } from "@/domain/entities/image";
import type {
  KnowledgeJson,
  KnowledgeJsonAtom,
  KnowledgeJsonAtomImage,
} from "@/domain/knowledge/knowledge-json";
import {
  isFigureStorageKey,
  isStudyIllustrationImage,
  shouldCreateImageExplainCard,
} from "./image-study";
import {
  captionReferencesDifferentAtom,
  isImageLinkSemanticallyValid,
  resolveSemanticImageLinks,
  scoreSemanticImageMatch,
  selectGreedySemanticLinks,
  MIN_PAGE_IMAGE_LINK_SCORE,
  type SemanticImageLinkTarget,
} from "./link-images-semantically";
import type { UsageTracker } from "./optimization";

export interface ImageLinkingSummary {
  atomCount: number;
  studyImageCount: number;
  atomsWithImages: number;
  unassignedImageCount: number;
}

function buildImageReference(
  image: Image,
  atom: KnowledgeJsonAtom
): KnowledgeJsonAtomImage {
  const caption = image.caption?.trim();

  return {
    imageId: image.id,
    caption: caption ? caption : `Figura: ${atom.title}`,
    description: imageDescription(atom, image),
    referencedConcepts: atom.keywords.slice(0, 4),
  };
}

function imageDescription(
  atom: KnowledgeJsonAtom,
  image?: Image
): string {
  const caption = image?.caption?.trim();
  if (caption && caption.length >= 3) {
    return `L'illustrazione «${caption}» supporta la comprensione di ${atom.title}.`;
  }

  const summary = atom.summary.trim();
  if (summary.length >= 12) {
    return summary;
  }

  const explanation = atom.explanation.trim();
  if (explanation.length >= 12) {
    return explanation.slice(0, 240);
  }

  return `${atom.title}. ${summary}`.trim().slice(0, 240);
}

function canLinkImageToAtom(image: Image, atom: KnowledgeJsonAtom): boolean {
  return shouldCreateImageExplainCard(image, {
    caption: image.caption?.trim() || `Figura: ${atom.title}`,
    description: imageDescription(atom, image),
  });
}

function sanitizeExistingImages(
  atom: KnowledgeJsonAtom,
  validImageIds: Set<string>,
  imageById: Map<string, Image>
): KnowledgeJsonAtomImage[] {
  return atom.images.filter((reference) => {
    if (!validImageIds.has(reference.imageId)) {
      return false;
    }

    const image = imageById.get(reference.imageId);
    return shouldCreateImageExplainCard(image ?? null, reference);
  });
}

function groupImagesByPage(images: Image[]): Map<number, Image[]> {
  const grouped = new Map<number, Image[]>();

  for (const image of images) {
    if (!isStudyIllustrationImage(image)) {
      continue;
    }

    const page = image.pageNumber ?? 1;
    const bucket = grouped.get(page) ?? [];
    bucket.push(image);
    grouped.set(page, bucket);
  }

  return grouped;
}

function primaryPageForAtom(atom: KnowledgeJsonAtom, atomIndex: number): number {
  return atom.pageReferences[0] ?? atomIndex + 1;
}

function atomReferencesPage(
  atom: KnowledgeJsonAtom,
  atomIndex: number,
  page: number
): boolean {
  if (atom.pageReferences.length > 0) {
    return atom.pageReferences.includes(page);
  }

  return primaryPageForAtom(atom, atomIndex) === page;
}

function getUnassignedStudyImages(
  studyImages: Image[],
  assignedImageIds: Set<string>
): Image[] {
  return studyImages.filter((image) => !assignedImageIds.has(image.id));
}

function assignImageToAtom(
  atom: KnowledgeJsonAtom,
  image: Image,
  assignedImageIds: Set<string>
): KnowledgeJsonAtom {
  assignedImageIds.add(image.id);
  return {
    ...atom,
    images: [buildImageReference(image, atom)],
  };
}

function linkByExactPage(
  atoms: KnowledgeJsonAtom[],
  imagesByPage: Map<number, Image[]>,
  assignedImageIds: Set<string>
): KnowledgeJsonAtom[] {
  const updated = [...atoms];
  const pageNumbers = [...imagesByPage.keys()].sort((left, right) => left - right);

  for (const page of pageNumbers) {
    const pageImages = (imagesByPage.get(page) ?? []).filter(
      (image) => !assignedImageIds.has(image.id)
    );
    if (pageImages.length === 0) {
      continue;
    }

    const scoredLinks: Array<{
      atomIndex: number;
      imageIndex: number;
      confidence: number;
    }> = [];

    updated.forEach((atom, atomIndex) => {
      if (atom.images.length > 0 || !atomReferencesPage(atom, atomIndex, page)) {
        return;
      }

      pageImages.forEach((image, imageIndex) => {
        if (captionReferencesDifferentAtom(atom, image, updated)) {
          return;
        }

        const isExtractedFigure =
          isFigureStorageKey(image.storageKey) || image.fallbackToFullPage;

        if (
          !isExtractedFigure &&
          !isImageLinkSemanticallyValid(atom, image, updated)
        ) {
          return;
        }

        const confidence = scoreSemanticImageMatch(atom, image);
        const effectiveConfidence = isExtractedFigure
          ? Math.max(confidence, MIN_PAGE_IMAGE_LINK_SCORE)
          : confidence;

        if (effectiveConfidence < MIN_PAGE_IMAGE_LINK_SCORE) {
          return;
        }

        if (!canLinkImageToAtom(image, atom)) {
          return;
        }

        scoredLinks.push({
          atomIndex,
          imageIndex,
          confidence: effectiveConfidence,
        });
      });
    });

    for (const link of selectGreedySemanticLinks(scoredLinks)) {
      const atom = updated[link.atomIndex];
      const image = pageImages[link.imageIndex];
      if (
        !atom ||
        atom.images.length > 0 ||
        !image ||
        assignedImageIds.has(image.id)
      ) {
        continue;
      }

      updated[link.atomIndex] = assignImageToAtom(atom, image, assignedImageIds);
    }
  }

  return updated;
}

async function linkBySemanticMatch(
  atoms: KnowledgeJsonAtom[],
  studyImages: Image[],
  assignedImageIds: Set<string>,
  tracker?: UsageTracker
): Promise<KnowledgeJsonAtom[]> {
  const candidates = atoms
    .map((atom, atomIndex) => ({ atom, atomIndex }))
    .filter(({ atom }) => atom.images.length === 0);
  const targets: SemanticImageLinkTarget[] = getUnassignedStudyImages(
    studyImages,
    assignedImageIds
  ).map((image, imageIndex) => ({ image, imageIndex }));

  if (candidates.length === 0 || targets.length === 0) {
    return atoms;
  }

  const links = await resolveSemanticImageLinks(candidates, targets, tracker);
  const updated = [...atoms];

  for (const link of links) {
    const atom = updated[link.atomIndex];
    const target = targets[link.imageIndex];
    const image = target?.image;

    if (
      !atom ||
      atom.images.length > 0 ||
      !image ||
      assignedImageIds.has(image.id) ||
      !canLinkImageToAtom(image, atom) ||
      !isImageLinkSemanticallyValid(atom, image, updated)
    ) {
      continue;
    }

    updated[link.atomIndex] = assignImageToAtom(atom, image, assignedImageIds);
  }

  return updated;
}

export function summarizeImageLinking(
  atoms: KnowledgeJsonAtom[],
  studyImages: Image[]
): ImageLinkingSummary {
  const assignedIds = new Set(
    atoms.flatMap((atom) => atom.images.map((reference) => reference.imageId))
  );

  return {
    atomCount: atoms.length,
    studyImageCount: studyImages.length,
    atomsWithImages: atoms.filter((atom) => atom.images.length > 0).length,
    unassignedImageCount: studyImages.filter((image) => !assignedIds.has(image.id))
      .length,
  };
}

/**
 * Links study illustrations to atoms. Upload page photos used for OCR are ignored.
 */
export async function enrichKnowledgeWithImages(
  knowledge: KnowledgeJson,
  images: Image[],
  options?: { tracker?: UsageTracker }
): Promise<KnowledgeJson> {
  const studyImages = images.filter(isStudyIllustrationImage);
  if (studyImages.length === 0) {
    return {
      ...knowledge,
      atoms: knowledge.atoms.map((atom) => ({
        ...atom,
        images: atom.images.filter((reference) =>
          shouldCreateImageExplainCard({ caption: reference.caption }, reference)
        ),
      })),
    };
  }

  const validImageIds = new Set(studyImages.map((image) => image.id));
  const imageById = new Map(studyImages.map((image) => [image.id, image]));
  const assignedImageIds = new Set<string>();
  const imagesByPage = groupImagesByPage(studyImages);

  const atomsWithPreservedImages = knowledge.atoms.map((atom) => {
    const preserved = sanitizeExistingImages(atom, validImageIds, imageById);
    preserved.forEach((reference) => assignedImageIds.add(reference.imageId));
    return preserved.length > 0 ? { ...atom, images: preserved } : { ...atom, images: [] };
  });

  const exactLinked = linkByExactPage(
    atomsWithPreservedImages,
    imagesByPage,
    assignedImageIds
  );
  const semanticLinked = await linkBySemanticMatch(
    exactLinked,
    studyImages,
    assignedImageIds,
    options?.tracker
  );

  return {
    ...knowledge,
    atoms: semanticLinked,
  };
}
