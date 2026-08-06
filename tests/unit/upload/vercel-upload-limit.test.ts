import { describe, expect, it } from "vitest";
import {
  formatVercelUploadLimitMessage,
  isWithinVercelUploadLimit,
  VERCEL_MAX_UPLOAD_REQUEST_BYTES,
} from "@/upload/vercel-upload-limit";

describe("upload/vercel-upload-limit", () => {
  it("uses a limit below the Vercel 4.5 MB cap", () => {
    expect(VERCEL_MAX_UPLOAD_REQUEST_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });

  it("detects payloads above the safe limit", () => {
    expect(isWithinVercelUploadLimit(VERCEL_MAX_UPLOAD_REQUEST_BYTES)).toBe(
      true
    );
    expect(
      isWithinVercelUploadLimit(VERCEL_MAX_UPLOAD_REQUEST_BYTES + 1)
    ).toBe(false);
  });

  it("formats a user-facing limit message", () => {
    expect(formatVercelUploadLimitMessage(5 * 1024 * 1024)).toContain("5.0 MB");
    expect(formatVercelUploadLimitMessage(5 * 1024 * 1024)).toContain("4 MB");
  });
});
