import type { Image } from "@/domain/entities/image";
import type {
  KnowledgeJson,
  KnowledgeJsonAtom,
  KnowledgeJsonAtomImage,
} from "@/domain/knowledge/knowledge-json";

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
  validImageIds: Set<string>
): KnowledgeJsonAtomImage[] {
  return atom.images.filter((reference) => validImageIds.has(reference.imageId));
}

function groupImagesByPage(images: Image[]): Map<number, Image[]> {
  const grouped = new Map<number, Image[]>();

  for (const image of images) {
    const page = image.pageNumber ?? 1;
    const bucket = grouped.get(page) ?? [];
    bucket.push(image);
    grouped.set(page, bucket);
  }

  return grouped;
}

/**
 * Links uploaded chapter images to extracted atoms using page references.
 * Fulfills the extraction prompt contract: images are attached after LLM extraction.
 */
export function enrichKnowledgeWithImages(
  knowledge: KnowledgeJson,
  images: Image[]
): KnowledgeJson {
  if (images.length === 0) {
    return knowledge;
  }

  const validImageIds = new Set(images.map((image) => image.id));
  const assignedImageIds = new Set<string>();
  const imagesByPage = groupImagesByPage(images);

  const atomsWithPreservedImages = knowledge.atoms.map((atom) => {
    const preserved = sanitizeExistingImages(atom, validImageIds);
    preserved.forEach((reference) => assignedImageIds.add(reference.imageId));
    return preserved.length > 0 ? { ...atom, images: preserved } : atom;
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

      if (candidate) {
        assignedImageIds.add(candidate.id);
        return {
          ...atom,
          images: [buildImageReference(candidate, atom)],
        };
      }
    }

    return atom;
  });

  const remainingImages = images.filter((image) => !assignedImageIds.has(image.id));
  if (remainingImages.length === 1) {
    const targetIndex = linkedAtoms.findIndex((atom) => atom.images.length === 0);
    if (targetIndex >= 0) {
      const targetAtom = linkedAtoms[targetIndex]!;
      const image = remainingImages[0]!;
      linkedAtoms[targetIndex] = {
        ...targetAtom,
        images: [buildImageReference(image, targetAtom)],
      };
    }
  }

  return {
    ...knowledge,
    atoms: linkedAtoms,
  };
}
