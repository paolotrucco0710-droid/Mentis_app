import { describe, expect, it } from "vitest";
import { mergeSelectedUploadFiles } from "@/upload/merge-selected-files";

function makeFile(name: string, size = 100, lastModified = 1_700_000_000_000): File {
  return new File(["x".repeat(size)], name, {
    type: "image/jpeg",
    lastModified,
  });
}

describe("mergeSelectedUploadFiles", () => {
  it("appends new camera captures to previously selected files", () => {
    const first = makeFile("page-1.jpg");
    const second = makeFile("page-2.jpg");

    expect(mergeSelectedUploadFiles([first], [second])).toEqual([first, second]);
  });

  it("keeps existing files when the same capture is reported twice", () => {
    const first = makeFile("page-1.jpg");
    const duplicate = makeFile("page-1.jpg");

    expect(mergeSelectedUploadFiles([first], [duplicate])).toEqual([first]);
  });

  it("adds multiple files selected together from the gallery", () => {
    const existing = makeFile("page-1.jpg");
    const gallery = [makeFile("page-2.jpg"), makeFile("page-3.jpg")];

    expect(mergeSelectedUploadFiles([existing], gallery)).toEqual([
      existing,
      gallery[0],
      gallery[1],
    ]);
  });
});
