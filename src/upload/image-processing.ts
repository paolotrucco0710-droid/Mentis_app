import sharp from "sharp";

const MAX_NORMALIZED_DIMENSION = 2048;
const MAX_MASTER_DIMENSION = 4096;
const NORMALIZED_JPEG_QUALITY = 85;
const MASTER_JPEG_QUALITY = 95;

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
}

export async function processImageNormalized(
  buffer: Buffer,
  mimeType: string
): Promise<ProcessedImage> {
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();

  const metadata = await pipeline.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  let transformer = sharp(buffer, { failOn: "none" }).rotate();

  if (width > MAX_NORMALIZED_DIMENSION || height > MAX_NORMALIZED_DIMENSION) {
    transformer = transformer.resize({
      width: MAX_NORMALIZED_DIMENSION,
      height: MAX_NORMALIZED_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const output =
    mimeType === "image/png"
      ? transformer.png({ compressionLevel: 8 })
      : transformer.jpeg({ quality: NORMALIZED_JPEG_QUALITY, mozjpeg: true });

  const processedBuffer = await output.toBuffer();
  const processedMeta = await sharp(processedBuffer).metadata();

  const usePng = mimeType === "image/png";
  return {
    buffer: processedBuffer,
    mimeType: usePng ? "image/png" : "image/jpeg",
    extension: usePng ? "png" : "jpg",
    width: processedMeta.width ?? width,
    height: processedMeta.height ?? height,
  };
}

/** @deprecated Use processImageNormalized */
export const processImage = processImageNormalized;

/**
 * High-resolution master kept for figure crops. Only rotates and caps extreme dimensions.
 */
export async function processImageMaster(
  buffer: Buffer,
  mimeType: string
): Promise<ProcessedImage> {
  const metadata = await sharp(buffer, { failOn: "none" }).rotate().metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  let transformer = sharp(buffer, { failOn: "none" }).rotate();

  if (width > MAX_MASTER_DIMENSION || height > MAX_MASTER_DIMENSION) {
    transformer = transformer.resize({
      width: MAX_MASTER_DIMENSION,
      height: MAX_MASTER_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const output =
    mimeType === "image/png"
      ? transformer.png({ compressionLevel: 6 })
      : transformer.jpeg({ quality: MASTER_JPEG_QUALITY, mozjpeg: true });

  const processedBuffer = await output.toBuffer();
  const processedMeta = await sharp(processedBuffer).metadata();

  const usePng = mimeType === "image/png";
  return {
    buffer: processedBuffer,
    mimeType: usePng ? "image/png" : "image/jpeg",
    extension: usePng ? "png" : "jpg",
    width: processedMeta.width ?? width,
    height: processedMeta.height ?? height,
  };
}
