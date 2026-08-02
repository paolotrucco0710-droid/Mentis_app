import type { Image } from "@/domain/entities/image";
import type {
  KnowledgeJson,
  KnowledgeJsonAtom,
  KnowledgeJsonAtomImage,
} from "@/domain/knowledge/knowledge-json";
import {
  isStudyIllustrationImage,
  shouldCreateImageExplainCard,
} from "./image-study";

function buildImageReference(
  image: Image,
  atom: KnowledgeJsonAtom
): KnowledgeJsonAtomImage {
  const caption = image.caption?.trim();

  return {
    imageId: image.id,
    caption: caption ? caption : `Figura: ${atom.title}`,
    description: atom.summary,
    referencedConcepts: atom.keywords.slice(0, 4),
  };
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

/**
 * Links study illustrations to atoms. Upload page photos used for OCR are ignored.
 */
export function enrichKnowledgeWithImages(
  knowledge: KnowledgeJson,
  images: Image[]
): KnowledgeJson {
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

  const linkedAtoms = atomsWithPreservedImages.map((atom) => {
    if (atom.images.length > 0) {
      return atom;
    }

    const pages = atom.pageReferences.length > 0 ? atom.pageReferences : [1];

    for (const page of pages) {
      const candidate = (imagesByPage.get(page) ?? []).find(
        (image) => !assignedImageIds.has(image.id)
      );

      if (
        candidate &&
        shouldCreateImageExplainCard(candidate, {
          caption: candidate.caption?.trim() || `Figura: ${atom.title}`,
          description: atom.summary,
        })
      ) {
        assignedImageIds.add(candidate.id);
        return {
          ...atom,
          images: [buildImageReference(candidate, atom)],
        };
      }
    }

    return atom;
  });

  return {
    ...knowledge,
    atoms: linkedAtoms,
  };
}
