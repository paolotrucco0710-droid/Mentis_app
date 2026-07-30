import sharp from "sharp";

const MAX_IMAGE_DIMENSION = 2048;
const JPEG_QUALITY = 85;

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
}

export async function processImage(
  buffer: Buffer,
  mimeType: string
): Promise<ProcessedImage> {
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();

  const metadata = await pipeline.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  let transformer = sharp(buffer, { failOn: "none" }).rotate();

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    transformer = transformer.resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const output =
    mimeType === "image/png"
      ? transformer.png({ compressionLevel: 8 })
      : transformer.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

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
