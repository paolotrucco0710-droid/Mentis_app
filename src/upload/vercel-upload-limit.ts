/** Vercel serverless request body limit is 4.5 MB; keep a safety margin. */
export const VERCEL_MAX_UPLOAD_REQUEST_BYTES = 4 * 1024 * 1024;

export function isWithinVercelUploadLimit(totalBytes: number): boolean {
  return totalBytes <= VERCEL_MAX_UPLOAD_REQUEST_BYTES;
}

export function formatVercelUploadLimitMessage(totalBytes: number): string {
  const limitMb = VERCEL_MAX_UPLOAD_REQUEST_BYTES / (1024 * 1024);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  return `I file pesano ${totalMb} MB ma il limite per richiesta è ${limitMb} MB. Carica meno foto alla volta o usa immagini più piccole.`;
}
