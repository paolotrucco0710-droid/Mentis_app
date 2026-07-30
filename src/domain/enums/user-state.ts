/**
 * Persisted learning state per user-atom pair (Capitolo 7).
 */
export enum UserAtomLearningState {
  Locked = "locked",
  Available = "available",
  Learning = "learning",
  Practicing = "practicing",
  Mastered = "mastered",
  Review = "review",
  Forgotten = "forgotten",
  Archived = "archived",
}
