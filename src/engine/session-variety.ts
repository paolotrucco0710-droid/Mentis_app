import { MAX_SESSION_CARDS_PER_ATOM } from "./constants";
import type { ScoredAtomCandidate } from "./types";

export function filterCandidatesForSessionVariety(
  candidates: ScoredAtomCandidate[],
  recentAtomCounts: Map<string, number>
): ScoredAtomCandidate[] {
  if (candidates.length <= 1) {
    return candidates;
  }

  const neverStudied = candidates.filter(
    (candidate) => candidate.state.exposureCount === 0
  );
  if (neverStudied.length > 0) {
    return neverStudied;
  }

  const minSessionAppearances = Math.min(
    ...candidates.map(
      (candidate) => recentAtomCounts.get(candidate.atom.id) ?? 0
    )
  );
  const fairnessPool = candidates.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <= minSessionAppearances
  );
  if (fairnessPool.length > 0 && fairnessPool.length < candidates.length) {
    return fairnessPool;
  }

  const capped = candidates.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <
      MAX_SESSION_CARDS_PER_ATOM
  );

  return capped.length > 0 ? capped : candidates;
}
