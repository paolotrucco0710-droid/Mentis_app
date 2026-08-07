export {
  applyCropPadding,
  extractFiguresFromPageImages,
  FIGURE_DETECTION_PROMPT_VERSION,
  listFigureImages,
  mergeKnowledgeSourceImages,
  MIN_CROP_DIMENSION_PX,
  MIN_DETECTION_CONFIDENCE,
  normalizeBoundingBox,
  shouldUseFullPageFallback,
  toPixelBoundingBox,
  isSanityValidBoundingBox,
  type FigureRegionDetection,
  type PixelBoundingBox,
} from "./figure-pipeline-v4";

export type { NormalizedBoundingBox } from "@/domain/entities/image";

/** @deprecated Use isSanityValidBoundingBox — kept for legacy tests. */
export { isSanityValidBoundingBox as isValidFigureCrop } from "./figure-pipeline-v4";

export type FigureDetection = import("./figure-pipeline-v4").FigureRegionDetection;
