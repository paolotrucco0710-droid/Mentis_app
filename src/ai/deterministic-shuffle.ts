export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  for (let index = copy.length - 1; index > 0; index -= 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const swapIndex = (hash >>> 0) % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
