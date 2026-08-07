export function mergeSelectedUploadFiles(
  existing: File[],
  incoming: File[]
): File[] {
  const merged = [...existing];

  for (const file of incoming) {
    const isDuplicate = merged.some(
      (current) =>
        current.name === file.name &&
        current.size === file.size &&
        current.lastModified === file.lastModified
    );

    if (!isDuplicate) {
      merged.push(file);
    }
  }

  return merged;
}
