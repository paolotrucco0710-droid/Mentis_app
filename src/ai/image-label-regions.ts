import type { NormalizedBoundingBox } from "@/ai/extract-figures";
import { deterministicShuffle } from "@/ai/deterministic-shuffle";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";

export interface ImageLabelRegion {
  id: string;
  label: string;
  box: NormalizedBoundingBox;
}

export interface ImageLabelingTask {
  mode: "tap-zone";
  regions: ImageLabelRegion[];
  correctRegionId: string;
  targetLabel: string;
}

const GRID_LAYOUTS: Record<number, NormalizedBoundingBox[]> = {
  2: [
    { top: 0.02, left: 0.02, bottom: 0.48, right: 0.98 },
    { top: 0.52, left: 0.02, bottom: 0.98, right: 0.98 },
  ],
  3: [
    { top: 0.02, left: 0.02, bottom: 0.48, right: 0.48 },
    { top: 0.02, left: 0.52, bottom: 0.48, right: 0.98 },
    { top: 0.52, left: 0.02, bottom: 0.98, right: 0.98 },
  ],
  4: [
    { top: 0.02, left: 0.02, bottom: 0.48, right: 0.48 },
    { top: 0.02, left: 0.52, bottom: 0.48, right: 0.98 },
    { top: 0.52, left: 0.02, bottom: 0.98, right: 0.48 },
    { top: 0.52, left: 0.52, bottom: 0.98, right: 0.98 },
  ],
};

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const label of labels) {
    const trimmed = label.trim();
    if (trimmed.length < 3) {
      continue;
    }

    const key = normalizeLabel(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function buildImageLabelingTask(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>
): ImageLabelingTask | null {
  const targetLabel =
    imageReference.referencedConcepts[0]?.trim() ||
    atom.keywords[0]?.trim() ||
    atom.title.trim();

  if (!targetLabel) {
    return null;
  }

  const candidateLabels = uniqueLabels([
    targetLabel,
    ...imageReference.referencedConcepts,
    ...atom.keywords.slice(0, 4),
    ...atom.definitions.slice(0, 2),
  ]);

  if (candidateLabels.length < 2) {
    return null;
  }

  const labelCount = Math.min(candidateLabels.length, 4);
  const labels = deterministicShuffle(
    candidateLabels.slice(0, labelCount),
    atomId
  );
  const layout = GRID_LAYOUTS[labelCount];

  if (!layout) {
    return null;
  }

  const regions = labels.map((label, index) => ({
    id: `region-${index + 1}`,
    label,
    box: layout[index]!,
  }));

  const correctRegion = regions.find(
    (region) => normalizeLabel(region.label) === normalizeLabel(targetLabel)
  );

  if (!correctRegion) {
    return null;
  }

  return {
    mode: "tap-zone",
    regions,
    correctRegionId: correctRegion.id,
    targetLabel,
  };
}

export function buildImageLabelPrompt(targetLabel: string): string {
  return `Tocca la zona che corrisponde a «${targetLabel}».`;
}
