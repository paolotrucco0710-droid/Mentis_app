import type { ImageId, KnowledgeSourceId, UserId } from "../ids";

export type NormalizedBoundingBox = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

export type FigureRegionType =
  | "photo"
  | "map"
  | "diagram"
  | "chart"
  | "table"
  | "timeline"
  | "illustration"
  | "other";

export interface Image {
  id: ImageId;
  knowledgeSourceId: KnowledgeSourceId;
  ownerId: UserId;
  storageKey: string;
  masterStorageKey: string | null;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pageNumber: number | null;
  caption: string | null;
  sourcePageImageId: ImageId | null;
  bboxNormalized: NormalizedBoundingBox | null;
  detectionConfidence: number | null;
  pipelineVersion: string | null;
  fallbackToFullPage: boolean;
  regionType: FigureRegionType | string | null;
  containsText: boolean | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export const FIGURE_PIPELINE_VERSION = "figure-v4";
