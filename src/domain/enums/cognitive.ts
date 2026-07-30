/**
 * Cognitive Engine atom stages (Capitolo 5).
 * Used by the feed engine for real-time decisions.
 */
export enum CognitiveAtomStage {
  Locked = "locked",
  Learnable = "learnable",
  Learning = "learning",
  Consolidating = "consolidating",
  Stable = "stable",
  ReviewNeeded = "review_needed",
  Forgotten = "forgotten",
}

/** What a card interaction aims to improve. */
export enum CognitiveObjective {
  Comprehension = "comprehension",
  Memory = "memory",
  Retrieval = "retrieval",
  Connection = "connection",
  Stability = "stability",
}
